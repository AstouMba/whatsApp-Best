// contacts.js - Gestion des contacts

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
        this.renderContacts(e.target.value);
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
      this.renderContacts();
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
    const res = await fetch(`${this.apiBaseUrl}/conversations?archived=true`);
    const archivedConversations = await res.json();
    contactsList.innerHTML = '';
    if (archivedConversations.length === 0) {
      contactsList.innerHTML = '<p>Aucune conversation archivée.</p>';
    } else {
      archivedConversations.forEach(conv => {
        const div = document.createElement('div');
        div.className = 'contact-item archived';
        div.setAttribute('data-conv-id', conv.id);
        // Affiche le nom du contact/groupe (à adapter selon ta structure)
        div.textContent = conv.name || conv.title || `Conversation ${conv.id}`;
        contactsList.appendChild(div);
      });
    }
  } catch (e) {
    contactsList.innerHTML = '<p>Erreur lors du chargement.</p>';
  }
}
  renderContacts(filter = "") {
    const contactsList = document.getElementById('contactsList');
    if (!contactsList) return;
    
    contactsList.innerHTML = "";
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
            this.onContactSelected(contact.id); // Appelle le callback dans main.js
          }
          document.getElementById('contactsSelectorPanel').classList.add('hidden');
        });
        contactsList.appendChild(div);
      });
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
            this.onContactSelected(contact.id); // Appelle le callback dans main.js
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

  findContactById(id) {
    return this.contacts.find(c => String(c.id) === String(id));
  }
}