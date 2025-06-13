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

    this.init();
  }

  init() {
    this.setupEventListeners();
    // Pas de polling global au départ, il ne démarre que sur selectContact !
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
      this.displayMessage(message);
      await this.sendMessageToServer(message);
      messageInput.value = '';
      messageInput.focus();
      // On recharge la conversation après l'envoi pour voir le nouveau message (et ceux reçus pendant l'envoi)
      await this.loadConversation(this.currentContactId);
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

  displayMessage(message) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    // Vérifie si le message n'est pas déjà affiché
    if (messagesList.querySelector(`[data-message-id="${message.id}"]`)) return;

    const messageElement = this.createMessageElement(message);
    messagesList.appendChild(messageElement);

    this.scrollToBottom();
  }

  createMessageElement(message) {
  const isOwnMessage = String(message.fromUserId) === String(this.currentUser.id);

  const div = document.createElement('div');
  div.className = `flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`;
  div.dataset.messageId = message.id;

  div.innerHTML = `
    <div class="
      ${isOwnMessage
        ? 'bg-[#25d366] text-white rounded-2xl rounded-br-md'
        : 'bg-[#2a2f32] text-white rounded-2xl rounded-bl-md'
      }
      px-4 py-2 max-w-[65%] min-w-[70px] shadow
      font-medium
      "
    >
      ${message.content}
      <div class="flex items-center gap-1 text-xs mt-1
        ${isOwnMessage ? 'justify-end text-green-100' : 'justify-start text-gray-300'}">
        ${message.time || this.formatMessageTime(message.timestamp)}
        ${isOwnMessage ? '<i class="fa-solid fa-check-double ml-1 text-xs"></i>' : ''}
      </div>
    </div>
  `;
  return div;
}

  // -------- POLLING --------
//   startPollingConversation(contactId) {
//     this.stopPollingConversation();
//     this.pollingInterval = setInterval(() => {
//       this.loadConversation(contactId);
//     }, 2000); // toutes les 2 secondes
//   }

//   stopPollingConversation() {
//     if (this.pollingInterval) {
//       clearInterval(this.pollingInterval);
//       this.pollingInterval = null;
//     }
//   }

  // Appelle ceci quand tu sélectionnes un contact
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
      statusElement.textContent = contact.isGroup 
        ? `${contact.members?.length || 0} membres` 
        : 'en ligne';
    }
  }

  async loadConversation(contactId) {
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

      const messagesList = document.getElementById('messagesList');
      if (messagesList) messagesList.innerHTML = '';

      allMessages.forEach(message => {
        this.displayMessage(message);
      });

      // Mets à jour le cache local
      this.messages = allMessages;

    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
    }
  }

  updateMessageStatus(messageId, newStatus) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    const statusElement = messageElement.querySelector('.text-xs span:last-child');
    if (statusElement) {
      statusElement.innerHTML = this.getStatusIcon(newStatus);
    }

    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.status = newStatus;
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'sending':
        return '<i class="fa-solid fa-clock text-xs opacity-60"></i>';
      case 'sent':
        return '<i class="fa-solid fa-check text-xs"></i>';
      case 'delivered':
        return '<i class="fa-solid fa-check-double text-xs"></i>';
      case 'read':
        return '<i class="fa-solid fa-check-double text-xs text-blue-400"></i>';
      case 'failed':
        return '<i class="fa-solid fa-exclamation-triangle text-xs text-red-400"></i>';
      default:
        return '';
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
}