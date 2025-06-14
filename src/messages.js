// messages.js - Gestion des messages privés avec polling pour quasi temps réel

export class MessagesManager {
  constructor(apiBaseUrl, currentUser, contactsManager) {
    this.API_BASE_URL = apiBaseUrl;
    this.currentUser = currentUser;
    this.contactsManager = contactsManager;
    this.currentContactId = null;
    this.messages = [];
    this.isTyping = false;
    this.pollingInterval = null;
    this.lastMessageCount = 0; // Pour détecter les nouveaux messages
    this.displayedMessageIds = new Set(); // Pour éviter les doublons

    this.init();
  }

  init() {
    this.setupEventListeners();
    // Démarrer un polling global pour tous les messages reçus
    this.startGlobalPolling();
  }

  setupEventListeners() {
    const sendMessageForm = document.getElementById('sendMessageForm');
    const messageInput = document.getElementById('messageInput');

    if (sendMessageForm) {
      sendMessageForm.addEventListener('submit', (e) => this.handleSendMessage(e));
    }

    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage(e);
        }
      });

      messageInput.addEventListener('input', () => this.handleTyping());
    }
  }

  async handleSendMessage(e) {
    if (e) e.preventDefault();

    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    const messageError = document.getElementById('messageError');

    if (messageError) messageError.textContent = '';

    if (!content) {
      this.showError('messageError', 'Veuillez saisir un message');
      return;
    }

    if (!this.currentContactId) {
      this.showError('messageError', 'Veuillez sélectionner un contact');
      return;
    }

    if (!this.currentUser) {
      this.showError('messageError', 'Utilisateur non connecté');
      return;
    }

    try {
      const message = this.createMessage(content);
      
      // Afficher immédiatement le message envoyé
      this.displayMessage(message, true);
      
      // Envoyer au serveur
      await this.sendMessageToServer(message);
      
      // Vider le champ de saisie
      messageInput.value = '';
      messageInput.focus();
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      this.showError('messageError', 'Erreur lors de l\'envoi du message');
    }
  }

  createMessage(content, type = 'text') {
    return {
      id: this.generateMessageId(),
      fromUserId: this.currentUser.id,
      toUserId: this.currentContactId,
      content: content,
      type: type,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
  }

  async sendMessageToServer(message) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error('Erreur serveur');
      }

      const savedMessage = await response.json();
      this.updateMessageStatus(message.id, 'sent');
      
      // Ajouter le message sauvegardé à la liste locale
      this.messages.push(savedMessage);

      setTimeout(() => {
        this.updateMessageStatus(message.id, 'delivered');
      }, 1000);

    } catch (error) {
      console.error('Erreur envoi serveur:', error);
      this.updateMessageStatus(message.id, 'failed');
      throw error;
    }
  }

  displayMessage(message, isNewMessage = false) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    // Éviter les doublons
    if (this.displayedMessageIds.has(message.id)) return;
    
    this.displayedMessageIds.add(message.id);

    const messageElement = this.createMessageElement(message);
    messagesList.appendChild(messageElement);

    // Faire défiler vers le bas seulement pour les nouveaux messages
    if (isNewMessage) {
      this.scrollToBottom();
    }
  }

  createMessageElement(message) {
    const isOwnMessage = String(message.fromUserId) === String(this.currentUser.id);

    const div = document.createElement('div');
    div.className = `flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`;
    div.dataset.messageId = message.id;

    const bubbleClass = isOwnMessage 
      ? 'bg-[#25d366] text-white rounded-2xl rounded-br-md ml-12' 
      : 'bg-[#2a2f32] text-white rounded-2xl rounded-bl-md mr-12';

    div.innerHTML = `
      <div class="${bubbleClass} px-4 py-2 max-w-[70%] min-w-[100px] shadow-md">
        <div class="text-sm leading-relaxed">${message.content}</div>
        <div class="flex items-center gap-1 text-xs mt-1 opacity-70
          ${isOwnMessage ? 'justify-end text-green-100' : 'justify-start text-gray-300'}">
          <span>${this.formatMessageTime(message.timestamp)}</span>
          ${isOwnMessage ? '<i class="fa-solid fa-check-double ml-1 text-xs"></i>' : ''}
        </div>
      </div>
    `;
    return div;
  }

  // -------- POLLING GLOBAL --------
  startGlobalPolling() {
    console.log('Démarrage du polling global pour les messages reçus');
    setInterval(async () => {
      await this.checkForNewReceivedMessages();
    }, 2000); // Vérifier toutes les 2 secondes
  }

  async checkForNewReceivedMessages() {
    if (!this.currentUser) return;

    try {
      // Récupérer tous les messages reçus par l'utilisateur actuel
      const response = await fetch(`${this.API_BASE_URL}/messages?toUserId=${this.currentUser.id}`);
      const receivedMessages = await response.json();

      // Filtrer les nouveaux messages non encore affichés
      const newMessages = receivedMessages.filter(msg => 
        !this.displayedMessageIds.has(msg.id) && 
        String(msg.fromUserId) === String(this.currentContactId)
      );

      if (newMessages.length > 0) {
        console.log(`${newMessages.length} nouveau(x) message(s) reçu(s)`);
        
        // Trier par timestamp
        newMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Afficher les nouveaux messages
        newMessages.forEach(message => {
          this.displayMessage(message, true);
        });

        // Mettre à jour la liste locale
        this.messages.push(...newMessages);
      }

    } catch (error) {
      console.error('Erreur lors de la vérification des nouveaux messages:', error);
    }
  }

  // -------- POLLING CONVERSATION --------
  startPollingConversation(contactId) {
    this.stopPollingConversation();
    console.log(`Démarrage du polling pour la conversation avec ${contactId}`);
    this.pollingInterval = setInterval(async () => {
      await this.checkConversationMessages(contactId);
    }, 3000);
  }

  stopPollingConversation() {
    if (this.pollingInterval) {
      console.log('Arrêt du polling de conversation');
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async checkConversationMessages(contactId) {
    try {
      const urlA = `${this.API_BASE_URL}/messages?fromUserId=${contactId}&toUserId=${this.currentUser.id}`;
      const urlB = `${this.API_BASE_URL}/messages?fromUserId=${this.currentUser.id}&toUserId=${contactId}`;

      const [sentResp, receivedResp] = await Promise.all([
        fetch(urlA),
        fetch(urlB)
      ]);

      const sentMessages = await sentResp.json();
      const receivedMessages = await receivedResp.json();

      const allMessages = [...sentMessages, ...receivedMessages];
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Afficher les nouveaux messages de cette conversation
      const newMessages = allMessages.filter(msg => !this.displayedMessageIds.has(msg.id));
      
      if (newMessages.length > 0) {
        newMessages.forEach(message => {
          this.displayMessage(message, true);
        });
      }

      this.messages = allMessages;

    } catch (error) {
      console.error('Erreur lors de la vérification de la conversation:', error);
    }
  }

  async selectContact(contactId) {
    this.currentContactId = contactId;
    this.updateCurrentContactDisplay();
    await this.loadConversation(contactId);
    this.startPollingConversation(contactId);
  }

  updateCurrentContactDisplay() {
    const currentContactDiv = document.getElementById('currentContact');
    if (!currentContactDiv) return;

    const contact = this.findContactById(this.currentContactId);
    if (!contact) return;

    const avatar = currentContactDiv.querySelector('div:first-child');
    const nameElement = currentContactDiv.querySelector('h3');
    const statusElement = currentContactDiv.querySelector('p');

    if (avatar) {
      if (contact.avatar) {
        avatar.innerHTML = `<img src="${contact.avatar}" class="w-full h-full rounded-full object-cover" alt="Avatar">`;
      } else {
        avatar.innerHTML = '';
        avatar.className = 'w-12 h-12 bg-[#25d366] rounded-full flex items-center justify-center text-white font-bold';
        avatar.textContent = contact.name ? contact.name.charAt(0).toUpperCase() : '?';
      }
    }

    if (nameElement) {
      nameElement.textContent = contact.name || contact.phone || 'Contact';
    }

    if (statusElement) {
      statusElement.textContent = 'en ligne';
    }
  }

  async loadConversation(contactId) {
    try {
      // Réinitialiser l'affichage
      const messagesList = document.getElementById('messagesList');
      if (messagesList) {
        messagesList.innerHTML = '';
        this.displayedMessageIds.clear();
      }

      const urlA = `${this.API_BASE_URL}/messages?fromUserId=${contactId}&toUserId=${this.currentUser.id}`;
      const urlB = `${this.API_BASE_URL}/messages?fromUserId=${this.currentUser.id}&toUserId=${contactId}`;

      const [sentResp, receivedResp] = await Promise.all([
        fetch(urlA),
        fetch(urlB)
      ]);

      const sentMessages = await sentResp.json();
      const receivedMessages = await receivedResp.json();

      const allMessages = [...sentMessages, ...receivedMessages];
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Afficher tous les messages de la conversation
      allMessages.forEach(message => {
        this.displayMessage(message, false);
      });

      this.messages = allMessages;
      this.lastMessageCount = allMessages.length;

      // Faire défiler vers le bas après chargement
      setTimeout(() => this.scrollToBottom(), 100);

      console.log(`Conversation chargée: ${allMessages.length} messages`);

    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
    }
  }

  updateMessageStatus(messageId, newStatus) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    const statusIcon = messageElement.querySelector('.fa-check-double');
    if (statusIcon) {
      statusIcon.className = this.getStatusIconClass(newStatus);
    }

    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.status = newStatus;
    }
  }

  getStatusIconClass(status) {
    switch (status) {
      case 'sending':
        return 'fa-solid fa-clock text-xs opacity-60';
      case 'sent':
        return 'fa-solid fa-check text-xs';
      case 'delivered':
        return 'fa-solid fa-check-double text-xs';
      case 'read':
        return 'fa-solid fa-check-double text-xs text-blue-400';
      case 'failed':
        return 'fa-solid fa-exclamation-triangle text-xs text-red-400';
      default:
        return 'fa-solid fa-check-double text-xs';
    }
  }

  formatMessageTime(timestamp) {
    const now = new Date();
    const messageDate = new Date(timestamp);

    if (now.toDateString() === messageDate.toDateString()) {
      return messageDate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return messageDate.toLocaleDateString('fr-FR', { 
        weekday: 'short'
      });
    } else {
      return messageDate.toLocaleDateString('fr-FR', { 
        day: '2-digit',
        month: '2-digit'
      });
    }
  }

  handleTyping() {
    if (this.isTyping) return;
    this.isTyping = true;
    setTimeout(() => {
      this.isTyping = false;
    }, 1000);
  }

  generateMessageId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  findContactById(id) {
    if (this.contactsManager) {
      return this.contactsManager.findContactById(id);
    }
    return null;
  }

  scrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  }

  showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.className = errorElement.className.replace('hidden', '');
      setTimeout(() => {
        errorElement.textContent = '';
        if (!errorElement.className.includes('hidden')) {
          errorElement.className += ' hidden';
        }
      }, 5000);
    }
  }

  setCurrentUser(user) {
    this.currentUser = user;
  }

  cleanup() {
    this.stopPollingConversation();
    this.currentContactId = null;
    this.messages = [];
    this.lastMessageCount = 0;
    this.displayedMessageIds.clear();
  }
}