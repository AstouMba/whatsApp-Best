import { RegisterManager } from './register.js';
import { LoginManager } from './login.js';
import { ContactsManager } from './contacts.js';

class App {
  constructor() {
    // URL backend à utiliser partout
    this.API_BASE_URL = "https://json-server-vzzw.onrender.com";
    this.loginManager = null;
    this.contactsManager = null;
    this.registerManager = null;

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
    this.contactsManager = new ContactsManager(this.API_BASE_URL);
    this.registerManager = new RegisterManager(this.API_BASE_URL);

    // Pour debugging
    window.loginManager = this.loginManager;
    window.contactsManager = this.contactsManager;
    window.registerManager = this.registerManager;

    console.log('Application initialisée avec succès');
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
  getApiBaseUrl() { return this.API_BASE_URL; }
}

// Lance l'application
const app = new App();
window.app = app;