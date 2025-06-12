import { RegisterManager } from './register.js';
import { LoginManager } from './login.js';
import { ContactsManager } from './contacts.js';
import { GroupsManager } from './groupes.js';
import { MessagesManager } from './messages.js';

class App {
  constructor() {
    // URL backend à utiliser partout
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
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApp());
    } else {
      this.setupApp();
    }
  }

  setupApp() {
    this.setupDropdownMenus();

    // Initialisation des gestionnaires
    this.loginManager = new LoginManager(this.API_BASE_URL);
    // this.contactsManager = new ContactsManager(this.API_BASE_URL);
    this.registerManager = new RegisterManager(this.API_BASE_URL);
    
    // Écouter les événements de connexion pour initialiser les autres managers
    this.setupLoginEventListeners();

    // Pour debugging
    window.loginManager = this.loginManager;
    window.contactsManager = this.contactsManager;
    window.registerManager = this.registerManager;

    console.log('Application initialisée avec succès');
  }

  setupLoginEventListeners() {
    // Écouter l'événement de connexion réussie
    document.addEventListener('userLoggedIn', (event) => {
      this.currentUser = event.detail.user;
      this.contactsManager = new ContactsManager(this.API_BASE_URL, this.currentUser);
      this.initializeUserDependentManagers();
    });
    document.addEventListener('userLoggedIn', (event) => {
      this.currentUser = event.detail.user;
      this.initializeUserDependentManagers();
    });

    // Écouter l'événement de déconnexion
    document.addEventListener('userLoggedOut', () => {
      this.currentUser = null;
      this.contactsManager = null;
      this.groupsManager = null;
      this.messagesManager = null;

      document.getElementById('contactsList').innerHTML = "";
      document.getElementById('allContactsList').innerHTML = "";
    });
    document.addEventListener('userLoggedOut', () => {
      this.currentUser = null;
      this.messagesManager = null;
      this.groupsManager = null;
    });
  }

  initializeUserDependentManagers() {
    if (!this.currentUser) return;

    // Initialiser les gestionnaires qui dépendent de l'utilisateur connecté
    this.groupsManager = new GroupsManager(
      this.API_BASE_URL, 
      this.currentUser, 
      this.contactsManager
    );

    this.messagesManager = new MessagesManager(
      this.API_BASE_URL, 
      this.currentUser, 
      this.contactsManager
    );

    // Ajouter aux objets globaux pour debugging
    window.groupsManager = this.groupsManager;
    window.messagesManager = this.messagesManager;

    console.log('Gestionnaires utilisateur initialisés:', {
      user: this.currentUser,
      messagesManager: this.messagesManager,
      groupsManager: this.groupsManager
    });
  }

  setupDropdownMenus() {
    // Gestion du menu principal
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    if (menuBtn && menuDropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('hidden');
      });
    }

    // Gestion du menu d'actions
    const actionsMenuBtn = document.getElementById('actionsMenuBtn');
    const actionsMenuDropdown = document.getElementById('actionsMenuDropdown');
    if (actionsMenuBtn && actionsMenuDropdown) {
      actionsMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actionsMenuDropdown.classList.toggle('hidden');
      });
    }

    // Ferme les menus au clic ailleurs
    document.body.addEventListener('click', () => {
      if (menuDropdown) menuDropdown.classList.add('hidden');
      if (actionsMenuDropdown) actionsMenuDropdown.classList.add('hidden');
    });
  }

  // Méthodes pour accéder aux gestionnaires
  getLoginManager() { return this.loginManager; }
  getContactsManager() { return this.contactsManager; }
  getRegisterManager() { return this.registerManager; }
  getGroupsManager() { return this.groupsManager; }
  getMessagesManager() { return this.messagesManager; }
  getCurrentUser() { return this.currentUser; }
  getApiBaseUrl() { return this.API_BASE_URL; }

  // Méthode pour mettre à jour l'utilisateur actuel
  setCurrentUser(user) {
    this.currentUser = user;
    
    // Mettre à jour les gestionnaires existants
    if (this.messagesManager) {
      this.messagesManager.setCurrentUser(user);
    }
    
    // Émettre un événement personnalisé
    document.dispatchEvent(new CustomEvent('userUpdated', { 
      detail: { user: user } 
    }));
  }
}

// Gestion des paramètres
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