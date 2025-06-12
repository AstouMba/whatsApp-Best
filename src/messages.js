// messages.js
export class MessagesManager {
    constructor(apiBaseUrl, currentUser, contactsManager) {
        this.API_BASE_URL = apiBaseUrl;
        this.currentUser = currentUser;
        this.contactsManager = contactsManager;
        this.currentContactId = null;
        this.messages = [];
        this.isTyping = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMessages();
    }

    setupEventListeners() {
        // Formulaire d'envoi de message
        const sendMessageForm = document.getElementById('sendMessageForm');
        const messageInput = document.getElementById('messageInput');

        if (sendMessageForm) {
            sendMessageForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        }

        if (messageInput) {
            // Envoi avec Entrée
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage(e);
                }
            });

            // Indicateur de frappe
            messageInput.addEventListener('input', () => this.handleTyping());
        }

        // Sélection de contact depuis la liste
        document.addEventListener('click', (e) => {
            const contactItem = e.target.closest('[data-contact-id]');
            if (contactItem) {
                const contactId = contactItem.dataset.contactId;
                this.selectContact(contactId);
            }
        });
    }

    // Gérer l'envoi de message
    async handleSendMessage(e) {
        e.preventDefault();
        
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        const messageError = document.getElementById('messageError');

        // Réinitialiser les erreurs
        if (messageError) messageError.textContent = '';

        // Validations
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
            // Créer le message
            const message = this.createMessage(content);
            
            // Afficher immédiatement dans l'interface
            this.displayMessage(message);
            
            // Envoyer au serveur
            await this.sendMessageToServer(message);
            
            // Réinitialiser le champ
            messageInput.value = '';
            messageInput.focus();
            
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            this.showError('messageError', 'Erreur lors de l\'envoi du message');
        }
    }

    // Créer un objet message
    createMessage(content, type = 'text') {
        return {
            id: this.generateMessageId(),
            senderId: this.currentUser.id,
            senderName: this.currentUser.name,
            receiverId: this.currentContactId,
            content: content,
            type: type,
            timestamp: new Date().toISOString(),
            status: 'sending',
            isGroup: this.isCurrentContactGroup()
        };
    }

    // Envoyer le message au serveur
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
            
            // Mettre à jour le statut
            this.updateMessageStatus(message.id, 'sent');
            
            // Ajouter à la liste locale
            this.messages.push(savedMessage);
            
            // Mettre à jour la liste des contacts
            this.updateContactLastMessage(savedMessage);
            
            // Simuler la livraison
            setTimeout(() => {
                this.updateMessageStatus(message.id, 'delivered');
            }, 1000);

        } catch (error) {
            console.error('Erreur envoi serveur:', error);
            this.updateMessageStatus(message.id, 'failed');
            throw error;
        }
    }

    // Afficher un message dans l'interface
    displayMessage(message) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        const messageElement = this.createMessageElement(message);
        messagesList.appendChild(messageElement);
        
        // Scroll vers le bas
        this.scrollToBottom();
    }

    // Créer l'élément DOM pour un message
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        const isOwnMessage = message.senderId === this.currentUser.id;
        
        messageDiv.className = `flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`;
        messageDiv.dataset.messageId = message.id;
        
        const messageContent = document.createElement('div');
        messageContent.className = `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isOwnMessage 
                ? 'bg-[#25d366] text-white' 
                : 'bg-[#232d35] text-gray-200'
        }`;
        
        // Nom de l'expéditeur pour les groupes
        if (message.isGroup && !isOwnMessage) {
            const senderName = document.createElement('div');
            senderName.className = 'text-xs font-semibold mb-1 text-[#25d366]';
            senderName.textContent = message.senderName || 'Inconnu';
            messageContent.appendChild(senderName);
        }
        
        // Contenu du message
        const contentDiv = document.createElement('div');
        contentDiv.className = 'break-words whitespace-pre-wrap';
        contentDiv.textContent = message.content;
        
        // Heure et statut
        const timeDiv = document.createElement('div');
        timeDiv.className = `text-xs mt-1 flex items-center justify-end gap-1 ${
            isOwnMessage ? 'text-green-100' : 'text-gray-400'
        }`;
        
        const timeText = this.formatMessageTime(message.timestamp);
        const statusIcon = isOwnMessage ? this.getStatusIcon(message.status) : '';
        
        timeDiv.innerHTML = `<span>${timeText}</span>${statusIcon}`;
        
        messageContent.appendChild(contentDiv);
        messageContent.appendChild(timeDiv);
        messageDiv.appendChild(messageContent);
        
        return messageDiv;
    }

    // Sélectionner un contact pour la conversation
    async selectContact(contactId) {
        this.currentContactId = contactId;
        
        // Mettre à jour l'interface
        this.updateCurrentContactDisplay();
        
        // Charger les messages de la conversation
        await this.loadConversation(contactId);
        
        // Marquer les messages comme lus
        this.markMessagesAsRead(contactId);
    }

    // Mettre à jour l'affichage du contact actuel
    updateCurrentContactDisplay() {
        const currentContactDiv = document.getElementById('currentContact');
        if (!currentContactDiv) return;

        const contact = this.findContactById(this.currentContactId);
        if (!contact) return;
        
        const avatar = currentContactDiv.querySelector('div:first-child');
        const nameElement = currentContactDiv.querySelector('h3');
        const statusElement = currentContactDiv.querySelector('p');
        
        // Avatar
        if (contact.avatar) {
            avatar.innerHTML = `<img src="${contact.avatar}" class="w-full h-full rounded-full object-cover" alt="Avatar">`;
        } else {
            avatar.innerHTML = '';
            avatar.className = 'w-12 h-12 bg-[#25d366] rounded-full flex items-center justify-center text-white font-bold';
            avatar.textContent = contact.name ? contact.name.charAt(0).toUpperCase() : '?';
        }
        
        // Nom
        if (nameElement) {
            nameElement.textContent = contact.name || contact.phone || 'Contact';
        }
        
        // Statut
        if (statusElement) {
            statusElement.textContent = contact.isGroup 
                ? `${contact.members?.length || 0} membres` 
                : 'en ligne';
        }
    }

    // Charger la conversation avec un contact
    async loadConversation(contactId) {
        try {
            const response = await fetch(
                `${this.API_BASE_URL}/messages?senderId=${contactId}&receiverId=${this.currentUser.id}`
            );
            const sentMessages = await response.json();

            const response2 = await fetch(
                `${this.API_BASE_URL}/messages?senderId=${this.currentUser.id}&receiverId=${contactId}`
            );
            const receivedMessages = await response2.json();

            // Combiner et trier les messages
            const allMessages = [...sentMessages, ...receivedMessages];
            allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Vider la liste actuelle
            const messagesList = document.getElementById('messagesList');
            if (messagesList) {
                messagesList.innerHTML = '';
            }

            // Afficher tous les messages
            allMessages.forEach(message => {
                this.displayMessage(message);
            });

        } catch (error) {
            console.error('Erreur lors du chargement de la conversation:', error);
        }
    }

    // Charger tous les messages
    async loadMessages() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/messages`);
            this.messages = await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
            this.messages = [];
        }
    }

    // Mettre à jour le statut d'un message
    updateMessageStatus(messageId, newStatus) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;

        const statusElement = messageElement.querySelector('.text-xs span:last-child');
        if (statusElement) {
            statusElement.innerHTML = this.getStatusIcon(newStatus);
        }

        // Mettre à jour dans la liste locale
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.status = newStatus;
        }
    }

    // Obtenir l'icône de statut
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

    // Formater l'heure du message
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

    // Mettre à jour le dernier message d'un contact
    updateContactLastMessage(message) {
        const contactElement = document.querySelector(`[data-contact-id="${this.currentContactId}"]`);
        if (!contactElement) return;

        const lastMessageElement = contactElement.querySelector('.text-sm.text-gray-400');
        const timeElement = contactElement.querySelector('.text-xs.text-gray-500');
        
        if (lastMessageElement) {
            const isOwnMessage = message.senderId === this.currentUser.id;
            const prefix = isOwnMessage ? 'Vous: ' : '';
            const truncatedContent = message.content.length > 30 
                ? message.content.substring(0, 30) + '...' 
                : message.content;
            
            lastMessageElement.textContent = prefix + truncatedContent;
        }
        
        if (timeElement) {
            timeElement.textContent = this.formatMessageTime(message.timestamp);
        }
        
        // Déplacer le contact en haut de la liste
        this.moveContactToTop(contactElement);
    }

    // Marquer les messages comme lus
    async markMessagesAsRead(contactId) {
        try {
            const unreadMessages = this.messages.filter(
                m => m.senderId === contactId && 
                     m.receiverId === this.currentUser.id && 
                     m.status !== 'read'
            );

            for (const message of unreadMessages) {
                await fetch(`${this.API_BASE_URL}/messages/${message.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: 'read' })
                });
                
                this.updateMessageStatus(message.id, 'read');
            }
        } catch (error) {
            console.error('Erreur lors du marquage comme lu:', error);
        }
    }

    // Gérer l'indicateur de frappe
    handleTyping() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        // Ici vous pouvez envoyer un signal de frappe au serveur
        
        setTimeout(() => {
            this.isTyping = false;
        }, 1000);
    }

    // Fonctions utilitaires
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    isCurrentContactGroup() {
        const contact = this.findContactById(this.currentContactId);
        return contact?.isGroup || false;
    }

    findContactById(id) {
        // Utiliser le contactsManager pour trouver le contact
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

    moveContactToTop(contactElement) {
        const contactsList = contactElement.parentNode;
        if (contactsList) {
            contactsList.insertBefore(contactElement, contactsList.firstChild);
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

    // Méthodes publiques pour interaction externe
    getCurrentContactId() {
        return this.currentContactId;
    }

    getMessages() {
        return this.messages;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }
}