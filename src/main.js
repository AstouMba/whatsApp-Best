import { RegisterManager } from './register.js';
import { LoginManager } from './login.js';
import { ContactsManager } from './contacts.js';
import { GroupsManager } from './groupes.js';
import { MessagesManager } from './messages.js';

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
    this.loginManager = new LoginManager(this.API_BASE_URL);
    this.registerManager = new RegisterManager(this.API_BASE_URL);

    this.setupLoginEventListeners();

    // Pour debugging
    window.loginManager = this.loginManager;
    window.registerManager = this.registerManager;

    console.log('Application initialisée avec succès');
  }

  setupLoginEventListeners() {
    document.addEventListener('userLoggedIn', (event) => {
      this.currentUser = event.detail.user;

      this.contactsManager = new ContactsManager(this.API_BASE_URL, this.currentUser);
      this.groupsManager = new GroupsManager(this.API_BASE_URL, this.currentUser, this.contactsManager);
      this.messagesManager = new MessagesManager(this.API_BASE_URL, this.currentUser, this.contactsManager);

      this.contactsManager.onContactSelected = (contactId) => {
        this.messagesManager.selectContact(contactId);
      };

      window.contactsManager = this.contactsManager;
      window.groupsManager = this.groupsManager;
      window.messagesManager = this.messagesManager;

      console.log('Gestionnaires utilisateur initialisés:', {
        user: this.currentUser,
        messagesManager: this.messagesManager,
        groupsManager: this.groupsManager
      });
    });

    document.addEventListener('userLoggedOut', () => {
      this.currentUser = null;
      this.contactsManager = null;
      this.groupsManager = null;
      this.messagesManager = null;

      // Nettoyer l'affichage si besoin
      const contactsList = document.getElementById('contactsList');
      if (contactsList) contactsList.innerHTML = "";
      const allContactsList = document.getElementById('allContactsList');
      if (allContactsList) allContactsList.innerHTML = "";
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

  // Méthodes utilitaires
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

// Gestion du panneau paramètres
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

// Lance l'application
const app = new App();
window.app = app;