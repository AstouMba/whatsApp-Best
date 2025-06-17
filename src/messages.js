import { setCurrentDiscussionContactId } from './contact-actions.js';

export class MessagesManager {
  constructor(apiBaseUrl, currentUser, contactsManager) {
    this.API_BASE_URL = apiBaseUrl;
    this.currentUser = currentUser;
    this.contactsManager = contactsManager;
    this.currentContactId = null;
    this.messages = [];
    this.isTyping = false;
    this.pollingInterval = null;
    this.globalPollingInterval = null;
    this.lastMessageCount = 0;
    this.displayedMessageIds = new Set();

    this.init();
  }

  init() {
    this.setupEventListeners();
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

      this.switchToConversationView();

      this.displayMessage(message, true);

      await this.sendMessageToServer(message);

      messageInput.value = '';
      messageInput.focus();

    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      this.showError('messageError', 'Erreur lors de l\'envoi du message');
    }
  }

  createMessage(content) {
    return {
      id: this.generateMessageId(),
      from: String(this.currentUser.id),
      to: String(this.currentContactId),
      text: content,
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
<<<<<<< HEAD
      
      // Remplacer le message temporaire par le message du serveur
=======

>>>>>>> 8b187fb (040)
      this.replaceTemporaryMessage(message.id, savedMessage);

      setTimeout(() => {
        this.updateMessageStatus(savedMessage.id, 'delivered');
      }, 1000);

    } catch (error) {
      console.error('Erreur envoi serveur:', error);
      this.updateMessageStatus(message.id, 'failed');
      throw error;
    }
  }

  replaceTemporaryMessage(tempId, serverMessage) {
<<<<<<< HEAD
    // Remplacer dans le tableau des messages
=======
>>>>>>> 8b187fb (040)
    const index = this.messages.findIndex(m => m.id === tempId);
    if (index !== -1) {
      this.messages[index] = serverMessage;
    } else {
      this.messages.push(serverMessage);
    }

<<<<<<< HEAD
    // Mettre à jour l'ID affiché
    this.displayedMessageIds.delete(tempId);
    this.displayedMessageIds.add(serverMessage.id);

    // Mettre à jour l'élément DOM
=======
    this.displayedMessageIds.delete(tempId);
    this.displayedMessageIds.add(serverMessage.id);

>>>>>>> 8b187fb (040)
    const messageElement = document.querySelector(`[data-message-id="${tempId}"]`);
    if (messageElement) {
      messageElement.setAttribute('data-message-id', serverMessage.id);
    }
  }

  displayMessage(message, isNewMessage = false) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    if (this.displayedMessageIds.has(message.id)) return;

    this.displayedMessageIds.add(message.id);

    const messageElement = this.createMessageElement(message);
    messagesList.appendChild(messageElement);

    if (isNewMessage) {
      this.scrollToBottom();
    }
  }

  createMessageElement(message) {
<<<<<<< HEAD
    // ✅ CORRECTION CRITIQUE : Vérifier qui a envoyé le message
    const isOwnMessage = String(message.fromUserId) === String(this.currentUser.id);
    
    console.log('Message:', message);
    console.log('fromUserId:', message.fromUserId, 'currentUser.id:', this.currentUser.id);
    console.log('isOwnMessage:', isOwnMessage);
=======
    const isOwnMessage = String(message.from) === String(this.currentUser.id);
>>>>>>> 8b187fb (040)

    const div = document.createElement('div');
    div.className = `flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`;
    div.dataset.messageId = message.id;

    const bubbleClass = isOwnMessage
      ? 'bg-[#25d366] text-white rounded-2xl rounded-br-md ml-12'
      : 'bg-[#2a2f32] text-white rounded-2xl rounded-bl-md mr-12';

    div.innerHTML = `
      <div class="${bubbleClass} px-4 py-2 max-w-[70%] min-w-[100px] shadow-md">
<<<<<<< HEAD
        <div class="text-sm leading-relaxed">${message.content}</div>
=======
        <div class="text-sm leading-relaxed">${message.text}</div>
>>>>>>> 8b187fb (040)
        <div class="flex items-center gap-1 text-xs mt-1 opacity-70
          ${isOwnMessage ? 'justify-end text-green-100' : 'justify-start text-gray-300'}">
          <span>${this.formatMessageTime(message.timestamp)}</span>
          ${isOwnMessage ? '<i class="fa-solid fa-check-double ml-1 text-xs"></i>' : ''}
        </div>
      </div>
    `;
    return div;
  }

<<<<<<< HEAD
  // -------- POLLING GLOBAL AMÉLIORÉ --------
=======
  // -------- POLLING GLOBAL CORRIGÉ : affiche toute la discussion courante --------
>>>>>>> 8b187fb (040)
  startGlobalPolling() {
    if (this.globalPollingInterval) clearInterval(this.globalPollingInterval);
    this.globalPollingInterval = setInterval(async () => {
      await this.checkForNewConversationMessages();
    }, 2000);
  }

  // Corrigé : affiche tous les messages de la discussion courante (envoyés ET reçus)
  async checkForNewConversationMessages() {
    // Ne poll que si une conversation est sélectionnée
    if (!this.currentUser || !this.currentContactId) return;

    try {
<<<<<<< HEAD
      // Récupérer tous les messages reçus récents
      const response = await fetch(`${this.API_BASE_URL}/messages?toUserId=${this.currentUser.id}&_sort=timestamp&_order=desc`);
      const allReceivedMessages = await response.json();

      // Filtrer les nouveaux messages non affichés
      const newMessages = allReceivedMessages.filter(msg => 
        !this.displayedMessageIds.has(msg.id)
      );

      if (newMessages.length > 0) {
        // Trier par timestamp croissant pour affichage chronologique
        newMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Si on reçoit un message d'un contact différent, basculer vers cette conversation
        const firstNewMessage = newMessages[0];
        if (this.currentContactId !== String(firstNewMessage.fromUserId)) {
          console.log(`Nouveau message reçu de ${firstNewMessage.fromUserId}, basculement automatique`);
          await this.selectContact(String(firstNewMessage.fromUserId));
        }

        // Afficher les nouveaux messages
        newMessages.forEach(message => {
          // Ne afficher que si c'est pour la conversation courante
          if (String(message.fromUserId) === String(this.currentContactId)) {
            this.displayMessage(message, true);
          }
        });

        // Basculer vers la vue conversation
        this.switchToConversationView();

        this.messages.push(...newMessages);
=======
      const urlA = `${this.API_BASE_URL}/messages?from=${this.currentContactId}&to=${this.currentUser.id}`;
      const urlB = `${this.API_BASE_URL}/messages?from=${this.currentUser.id}&to=${this.currentContactId}`;

      const [receivedResp, sentResp] = await Promise.all([
        fetch(urlA),
        fetch(urlB)
      ]);

      const receivedMessages = await receivedResp.json();
      const sentMessages = await sentResp.json();

      const allMessages = [...receivedMessages, ...sentMessages];
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const newMessages = allMessages.filter(
        msg => !this.displayedMessageIds.has(msg.id)
      );

      if (newMessages.length > 0) {
        newMessages.forEach(message => {
          this.displayMessage(message, true);
        });
        this.messages = allMessages;
>>>>>>> 8b187fb (040)
      }
    } catch (error) {
      console.error('Erreur lors du polling de la conversation:', error);
    }
  }

  switchToConversationView() {
    const startConversationView = document.getElementById('startConversationView');
    if (startConversationView) {
      startConversationView.style.display = 'none';
    }

    const conversationView = document.getElementById('conversationView');
    if (conversationView) {
      conversationView.style.display = 'flex';
    }

    const noContactSelected = document.getElementById('noContactSelected');
    if (noContactSelected) {
      noContactSelected.style.display = 'none';
    }

    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      messagesContainer.style.display = 'flex';
    }

    const messageInputContainer = document.getElementById('messageInputContainer');
    if (messageInputContainer) {
      messageInputContainer.style.display = 'flex';
    }
  }

  switchToStartConversationView() {
    const startConversationView = document.getElementById('startConversationView');
    if (startConversationView) {
      startConversationView.style.display = 'flex';
    }

    const conversationView = document.getElementById('conversationView');
    if (conversationView) {
      conversationView.style.display = 'none';
    }

    this.currentContactId = null;
    this.stopPollingConversation();

    const messagesList = document.getElementById('messagesList');
    if (messagesList) {
      messagesList.innerHTML = '';
      this.displayedMessageIds.clear();
    }
  }

  // -------- POLLING CONVERSATION AMÉLIORÉ --------
  startPollingConversation(contactId) {
    this.stopPollingConversation();
    this.pollingInterval = setInterval(async () => {
      await this.checkConversationMessages(contactId);
    }, 3000);
  }

  stopPollingConversation() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async checkConversationMessages(contactId) {
    try {
<<<<<<< HEAD
      // ✅ CORRECTION : Utiliser fromUserId et toUserId
      const urlA = `${this.API_BASE_URL}/messages?fromUserId=${contactId}&toUserId=${this.currentUser.id}`;
      const urlB = `${this.API_BASE_URL}/messages?fromUserId=${this.currentUser.id}&toUserId=${contactId}`;
=======
      const urlA = `${this.API_BASE_URL}/messages?from=${contactId}&to=${this.currentUser.id}`;
      const urlB = `${this.API_BASE_URL}/messages?from=${this.currentUser.id}&to=${contactId}`;
>>>>>>> 8b187fb (040)

      const [receivedResp, sentResp] = await Promise.all([
        fetch(urlA),
        fetch(urlB)
      ]);

      const receivedMessages = await receivedResp.json();
      const sentMessages = await sentResp.json();

      const allMessages = [...receivedMessages, ...sentMessages];
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const newMessages = allMessages.filter(msg => !this.displayedMessageIds.has(msg.id));

      if (newMessages.length > 0) {
        newMessages.forEach(message => {
          this.displayMessage(message, true);
        });
      }

      this.messages = allMessages;
<<<<<<< HEAD

=======
>>>>>>> 8b187fb (040)
    } catch (error) {
      console.error('Erreur lors de la vérification de la conversation:', error);
    }
  }

  async selectContact(contactId) {
    this.currentContactId = contactId;
    setCurrentDiscussionContactId(contactId);

    this.switchToConversationView();

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
      const messagesList = document.getElementById('messagesList');
      if (messagesList) {
        messagesList.innerHTML = '';
        this.displayedMessageIds.clear();
      }

<<<<<<< HEAD
      // ✅ CORRECTION : Utiliser fromUserId et toUserId
      const urlA = `${this.API_BASE_URL}/messages?fromUserId=${contactId}&toUserId=${this.currentUser.id}`;
      const urlB = `${this.API_BASE_URL}/messages?fromUserId=${this.currentUser.id}&toUserId=${contactId}`;
=======
      const urlA = `${this.API_BASE_URL}/messages?from=${contactId}&to=${this.currentUser.id}`;
      const urlB = `${this.API_BASE_URL}/messages?from=${this.currentUser.id}&to=${contactId}`;
>>>>>>> 8b187fb (040)

      const [receivedResp, sentResp] = await Promise.all([
        fetch(urlA),
        fetch(urlB)
      ]);

      const receivedMessages = await receivedResp.json();
      const sentMessages = await sentResp.json();

      const allMessages = [...receivedMessages, ...sentMessages];
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      allMessages.forEach(message => {
        this.displayMessage(message, false);
      });

      this.messages = allMessages;
      this.lastMessageCount = allMessages.length;

      setTimeout(() => this.scrollToBottom(), 100);

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
    if (this.globalPollingInterval) {
      clearInterval(this.globalPollingInterval);
      this.globalPollingInterval = null;
    }
    this.currentContactId = null;
    this.messages = [];
    this.lastMessageCount = 0;
    this.displayedMessageIds.clear();
  }
}