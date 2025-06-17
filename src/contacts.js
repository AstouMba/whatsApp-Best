// contacts.js - Gestion des contacts - VERSION CORRIGÉE (propriétés messages alignées)

export class ContactsManager {
  constructor(apiBaseUrl, currentUser) {
    this.API_BASE_URL = apiBaseUrl;
    this.currentUser = currentUser;
    this.contacts = [];
    this.onContactSelected = null; // callback à brancher dans main.js
    this.init();
  }

  init() {
    this.setupContactForm();
    this.setupSearch();
    this.setupContactSelector();
    this.setupMenuButtons();
    this.fetchContacts();
  }

  setupContactForm() {
    const btnNewContact = document.getElementById('btnNewContact');
    if (btnNewContact) {
      btnNewContact.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('addContactSection').classList.remove('hidden');
      });
    }

    const cancelBtn = document.getElementById('cancelAddContact');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        document.getElementById('addContactSection').classList.add('hidden');
      });
    }

    const addContactForm = document.getElementById('addContactForm');
    if (addContactForm) {
      addContactForm.addEventListener('submit', this.handleAddContact.bind(this));
    }
  }

  setupSearch() {
    const searchContacts = document.getElementById('searchContacts');
    if (searchContacts) {
      searchContacts.addEventListener('input', (e) => {
        this.renderDiscussionsFormat(e.target.value);
      });
    }

    const searchAllContacts = document.getElementById('searchAllContacts');
    if (searchAllContacts) {
      searchAllContacts.addEventListener('input', (e) => {
        this.renderContactsSelector(e.target.value);
      });
    }
  }

  setupContactSelector() {
    const nouveauChatBtn = document.querySelector('button[title="Nouveau chat"]');
    if (nouveauChatBtn) {
      nouveauChatBtn.id = "openContactsSelector";
      nouveauChatBtn.addEventListener('click', () => {
        document.getElementById('contactsSelectorPanel').classList.remove('hidden');
        this.renderContactsSelector();
      });
    }

    const closeBtn = document.getElementById('closeContactsSelector');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('contactsSelectorPanel').classList.add('hidden');
      });
    }
  }

  setupMenuButtons() {
    const btnArchives = document.getElementById('btnArchives');
    if (btnArchives) {
      btnArchives.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.app && window.app.contactsManager) {
          window.app.contactsManager.renderArchivedConversations();
          document.getElementById('groupsList').classList.add('hidden');
          document.getElementById('contactsList').classList.remove('hidden');
        }
      });
    }
  }

  async fetchContacts() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/contacts?userId=${this.currentUser.id}`);
      const data = await response.json();
      this.contacts = data;
      this.renderDiscussionsFormat(); // Affiche discussions au chargement
      this.renderContactsSelector();
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts:', error);
    }
  }

  async renderArchivedConversations() {
    const contactsList = document.getElementById('contactsList');
    if (!contactsList) return;
    contactsList.innerHTML = '<p>Chargement...</p>';
    try {
      const res = await fetch(`${this.API_BASE_URL}/conversations?archived=true`);
      const archivedConversations = await res.json();
      contactsList.innerHTML = '';
      if (archivedConversations.length === 0) {
        contactsList.innerHTML = '<p>Aucune conversation archivée.</p>';
      } else {
        archivedConversations.forEach(conv => {
          const div = document.createElement('div');
          div.className = 'contact-item archived';
          div.setAttribute('data-conv-id', conv.id);
          div.textContent = conv.name || conv.title || `Conversation ${conv.id}`;
          contactsList.appendChild(div);
        });
      }
    } catch (e) {
      contactsList.innerHTML = '<p>Erreur lors du chargement.</p>';
    }
  }

  renderContactsSelector(filter = "") {
    const list = document.getElementById('allContactsList');
    if (!list) return;

    list.innerHTML = "";
    this.contacts
      .filter(c =>
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        (c.phone && c.phone.toLowerCase().includes(filter.toLowerCase()))
      )
      .forEach(contact => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#232d35] cursor-pointer";
        div.innerHTML = `
          <img src="${contact.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}" class="w-10 h-10 rounded-full object-cover" alt="Avatar">
          <div>
            <div class="font-semibold text-white">${contact.name}</div>
            <div class="text-xs text-gray-400">${contact.phone || ''}</div>
          </div>
        `;
        div.addEventListener('click', () => {
          if (this.onContactSelected) {
            this.onContactSelected(contact.id);
          }
          document.getElementById('contactsSelectorPanel').classList.add('hidden');
        });
        list.appendChild(div);
      });
  }

  async handleAddContact(e) {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const avatar = document.getElementById('contactAvatar').value.trim();
    const errorDiv = document.getElementById('addContactError');

    if (!name || !phone) {
      errorDiv.textContent = "Nom et numéro obligatoires !";
      return;
    }

    try {
      const checkRes = await fetch(`${this.API_BASE_URL}/contacts?userId=${this.currentUser.id}&phone=${encodeURIComponent(phone)}`);
      const existing = await checkRes.json();
      if (existing.length > 0) {
        errorDiv.textContent = "Ce contact existe déjà !";
        return;
      }
    } catch (err) {
      errorDiv.textContent = "Erreur lors de la vérification du contact.";
      return;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/contacts`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, phone, avatar, userId: this.currentUser.id })
      });

      if (!response.ok) throw new Error('Erreur réseau');

      document.getElementById('addContactForm').reset();
      document.getElementById('addContactSection').classList.add('hidden');
      errorDiv.textContent = "";
      this.fetchContacts(); // recharge la liste après ajout
    } catch (err) {
      errorDiv.textContent = "Erreur lors de l'ajout du contact.";
      console.error('Erreur lors de l\'ajout du contact:', err);
    }
  }

  // Affichage style WhatsApp : discussions (avatar, nom, date, dernier message)
  async renderDiscussionsFormat(filter = "", options = {}) {
    const userId = this.currentUser.id;
    const contactsList = document.getElementById('contactsList');
    if (!contactsList) return;
    contactsList.innerHTML = "<p>Chargement...</p>";

    try {
      // 1. Récupère tous les contacts
      const contactsRes = await fetch(`${this.API_BASE_URL}/contacts?userId=${userId}`);
      let contacts = await contactsRes.json();

      // 2. ✅ CORRECTION : Utiliser fromUserId et toUserId pour récupérer les messages
      const allMessagesRes = await fetch(`${this.API_BASE_URL}/messages?_sort=timestamp&_order=desc`);
      const allMessages = await allMessagesRes.json();

      // 3. Filtre nom/numéro si besoin
      if (filter) {
        contacts = contacts.filter(c =>
          c.name.toLowerCase().includes(filter.toLowerCase()) ||
          (c.phone && c.phone.toLowerCase().includes(filter.toLowerCase()))
        );
      }

      // 4. Pour chaque contact, trouve le dernier message échangé
      const discussions = contacts.map(contact => {
        const messagesWithContact = allMessages.filter(
          msg =>
            (String(msg.fromUserId) === String(userId) && String(msg.toUserId) === String(contact.id)) ||
            (String(msg.toUserId) === String(userId) && String(msg.fromUserId) === String(contact.id))
        );
        let lastMsg = null;
        if (messagesWithContact.length > 0) {
          lastMsg = messagesWithContact[0]; // déjà triés par timestamp décroissant
        }
        return { contact, lastMsg };
      });

      // 5. Filtres supplémentaires (non lues, favoris)
      let filteredDiscussions = discussions;
      if (options.unreadOnly) {
        filteredDiscussions = discussions.filter(({ lastMsg }) =>
          lastMsg && !lastMsg.read && String(lastMsg.toUserId) === String(userId)
        );
      }
      if (options.favoritesOnly) {
        filteredDiscussions = discussions.filter(({ contact }) =>
          contact.favorite === true
        );
      }

      // 6. Trie pour mettre en haut les contacts AVEC messages, puis par date
      filteredDiscussions.sort((a, b) => {
        if (a.lastMsg && !b.lastMsg) return -1;
        if (!a.lastMsg && b.lastMsg) return 1;
        if (!a.lastMsg && !b.lastMsg) return 0;
        return new Date(b.lastMsg.timestamp) - new Date(a.lastMsg.timestamp);
      });

      // 7. Rendu
      contactsList.innerHTML = "";
      if (filteredDiscussions.length === 0) {
        contactsList.innerHTML = "<p class='text-gray-400 text-center py-4'>Aucune discussion trouvée</p>";
        return;
      }

      filteredDiscussions.forEach(({ contact, lastMsg }) => {
        let messagePreview = "";
        if (lastMsg) {
          messagePreview = lastMsg.content || 'Message sans texte';
          if (String(lastMsg.fromUserId) === String(userId)) {
            messagePreview = `Vous: ${messagePreview}`;
          }
        } else {
          messagePreview = 'Commencer une conversation';
        }

        const div = document.createElement('div');
        div.className = "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#232d35] cursor-pointer contact-item";
        div.setAttribute('data-contact-id', contact.id);
        div.innerHTML = `
          <img src="${contact.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}"
               class="w-12 h-12 rounded-full object-cover" alt="Avatar">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-white flex justify-between items-center">
              <span>${contact.name}</span>
              <span class="text-xs text-gray-400">
                ${lastMsg ? formatDateShort(lastMsg.timestamp) : ""}
              </span>
            </div>
            <div class="text-sm text-gray-400 truncate" title="${messagePreview}">
              ${messagePreview}
            </div>
          </div>
        `;
        div.addEventListener('click', () => {
          if (this.onContactSelected) {
            this.onContactSelected(contact.id);
          }
          const selector = document.getElementById('contactsSelectorPanel');
          if (selector && !selector.classList.contains('hidden')) {
            selector.classList.add('hidden');
          }
        });
        contactsList.appendChild(div);
      });
    } catch (error) {
      console.error('Erreur lors du rendu des discussions:', error);
      contactsList.innerHTML = "<p class='text-red-400 text-center py-4'>Erreur lors du chargement</p>";
    }
  }

  findContactById(id) {
    return this.contacts.find(c => String(c.id) === String(id));
  }
}

// Helper pour format court date (ex: 'vendredi', 'hier', heure...)
function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();

  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Hier";
  }

  const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    return jours[date.getDay()];
  }

  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}