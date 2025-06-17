import { RegisterManager } from './register.js';
import { LoginManager } from './login.js';
import { ContactsManager } from './contacts.js';
import { GroupsManager } from './groupes.js';
import { MessagesManager } from './messages.js';
import { setupContactSelection, setupContactMenuActions } from './contact-actions.js';

class App {
  constructor() {
    this.API_BASE_URL = "https://json-server-vzzw.onrender.com";
    this.loginManager = null;
    this.contactsManager = null;
    this.registerManager = null;
    this.groupsManager = null;
    this.messagesManager = null;
    this.currentUser = null;

    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApp());
    } else {
      this.setupApp();
    }
  }

  setupApp() {
    this.setupDropdownMenus();
    this.setupSidebarNav();

    this.loginManager = new LoginManager(this.API_BASE_URL);
    this.registerManager = new RegisterManager(this.API_BASE_URL);

    this.setupLoginEventListeners();
    setupContactSelection();
    setupContactMenuActions();

    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user } }));
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('appContainer').style.display = '';
    } else {
      document.getElementById('appContainer').style.display = 'none';
      document.getElementById('loginPage').style.display = '';
    }

    window.loginManager = this.loginManager;
    window.registerManager = this.registerManager;

    console.log('Application initialisée avec succès');
  }

  setupLoginEventListeners() {
    document.addEventListener('userLoggedIn', (event) => {
      this.currentUser = event.detail.user;

      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      this.contactsManager = new ContactsManager(this.API_BASE_URL, this.currentUser);
      this.groupsManager = new GroupsManager(this.API_BASE_URL, this.currentUser, this.contactsManager);
      this.messagesManager = new MessagesManager(this.API_BASE_URL, this.currentUser, this.contactsManager);

      this.contactsManager.onContactSelected = (contactId) => {
        this.messagesManager.selectContact(contactId);
      };

      window.contactsManager = this.contactsManager;
      window.groupsManager = this.groupsManager;
      window.messagesManager = this.messagesManager;

      // ✅ CORRIGÉ : Afficher les discussions au login (FORMAT WHATSAPP)
      this.showDiscussionsPanel();
    });

    document.addEventListener('userLoggedOut', () => {
      if (this.messagesManager) {
        this.messagesManager.cleanup();
      }

      localStorage.removeItem('currentUser');

      this.currentUser = null;
      this.contactsManager = null;
      this.groupsManager = null;
      this.messagesManager = null;

      const contactsList = document.getElementById('contactsList');
      if (contactsList) contactsList.innerHTML = "";
      const allContactsList = document.getElementById('allContactsList');
      if (allContactsList) allContactsList.innerHTML = "";
      const messagesList = document.getElementById('messagesList');
      if (messagesList) messagesList.innerHTML = "";

      document.getElementById('appContainer').style.display = 'none';
      document.getElementById('loginPage').style.display = '';
    });
  }

  setupDropdownMenus() {
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    if (menuBtn && menuDropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('hidden');
      });
    }

    const actionsMenuBtn = document.getElementById('actionsMenuBtn');
    const actionsMenuDropdown = document.getElementById('actionsMenuDropdown');
    if (actionsMenuBtn && actionsMenuDropdown) {
      actionsMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actionsMenuDropdown.classList.toggle('hidden');
      });
    }

    document.body.addEventListener('click', () => {
      if (menuDropdown) menuDropdown.classList.add('hidden');
      if (actionsMenuDropdown) actionsMenuDropdown.classList.add('hidden');
    });
  }

  setupSidebarNav() {
    document.addEventListener('DOMContentLoaded', () => {
      const discussionsBtn = document.querySelector('button[title="Discussions"]');
      if (discussionsBtn) {
        discussionsBtn.addEventListener('click', () => {
          this.showDiscussionsPanel();
        });
      }
    });
  }

  // ✅ CORRIGÉ : Utilise renderDiscussionsFormat
  showDiscussionsPanel() {
    const contactsPanel = document.getElementById('contactsList');
    if (contactsPanel) contactsPanel.parentElement.classList.remove('hidden');
    const groupsList = document.getElementById('groupsList');
    if (groupsList) groupsList.classList.add('hidden');
    if (contactsPanel) contactsPanel.classList.remove('hidden');
    if (this.contactsManager) {
      // ✅ CORRIGÉ : Utilise le format discussions (WhatsApp)
      this.contactsManager.renderDiscussionsFormat();
    }
  }

  getLoginManager() { return this.loginManager; }
  getContactsManager() { return this.contactsManager; }
  getRegisterManager() { return this.registerManager; }
  getGroupsManager() { return this.groupsManager; }
  getMessagesManager() { return this.messagesManager; }
  getCurrentUser() { return this.currentUser; }
  getApiBaseUrl() { return this.API_BASE_URL; }

  setCurrentUser(user) {
    this.currentUser = user;
    if (this.messagesManager) {
      this.messagesManager.setCurrentUser(user);
    }
    document.dispatchEvent(new CustomEvent('userUpdated', { 
      detail: { user: user } 
    }));
  }
}

// ✅ CORRIGÉ : Gestionnaire des boutons de filtre
document.addEventListener('DOMContentLoaded', () => {
  const allBtn = document.getElementById('filterAllBtn');
  const unreadBtn = document.getElementById('filterUnreadBtn');
  const favoriteBtn = document.getElementById('filterFavoriteBtn');
  const groupsBtn = document.getElementById('filterGroupsBtn');

  const setActiveBtn = (activeBtn) => {
    [allBtn, unreadBtn, favoriteBtn, groupsBtn].forEach(btn => {
      if (btn === activeBtn) {
        btn.classList.add('bg-[#25d366]', 'text-white');
        btn.classList.remove('bg-[#2a3942]', 'text-gray-200');
      } else {
        btn.classList.remove('bg-[#25d366]', 'text-white');
        btn.classList.add('bg-[#2a3942]', 'text-gray-200');
      }
    });
  };

  // ✅ CORRIGÉ : Toutes les discussions
  if (allBtn) {
    allBtn.addEventListener('click', () => {
      setActiveBtn(allBtn);
      // Utilise renderDiscussionsFormat pour le format WhatsApp
      if (window.app && window.app.contactsManager) {
        window.app.contactsManager.renderDiscussionsFormat();
      }
      document.getElementById('groupsList').classList.add('hidden');
      document.getElementById('contactsList').classList.remove('hidden');
    });
  }

  // ✅ CORRIGÉ : Discussions non lues
  if (unreadBtn) {
    unreadBtn.addEventListener('click', () => {
      setActiveBtn(unreadBtn);
      // Utilise renderDiscussionsFormat avec option unreadOnly
      if (window.app && window.app.contactsManager) {
        window.app.contactsManager.renderDiscussionsFormat('', { unreadOnly: true });
      }
      document.getElementById('groupsList').classList.add('hidden');
      document.getElementById('contactsList').classList.remove('hidden');
    });
  }

  // ✅ CORRIGÉ : Discussions favorites
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => {
      setActiveBtn(favoriteBtn);
      // Utilise renderDiscussionsFormat avec option favoritesOnly
      if (window.app && window.app.contactsManager) {
        window.app.contactsManager.renderDiscussionsFormat('', { favoritesOnly: true });
      }
      document.getElementById('groupsList').classList.add('hidden');
      document.getElementById('contactsList').classList.remove('hidden');
    });
  }

  // ✅ CORRECT : Groupes (pas de changement)
  if (groupsBtn) {
    groupsBtn.addEventListener('click', () => {
      setActiveBtn(groupsBtn);
      document.getElementById('contactsList').classList.add('hidden');
      document.getElementById('groupsList').classList.remove('hidden');
      if (window.app && window.app.groupsManager) {
        window.app.groupsManager.renderGroups();
      }
    });
  }
});

// ✅ CORRECT : Gestionnaire des paramètres
document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settingsBtn');
  const closeSettingsPanel = document.getElementById('closeSettingsPanel');
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      document.getElementById('settingsPanel').classList.remove('hidden');
    });
  }
  
  if (closeSettingsPanel) {
    closeSettingsPanel.addEventListener('click', () => {
      document.getElementById('settingsPanel').classList.add('hidden');
    });
  }
});

const app = new App();
window.app = app;