// main.js - Point d'entrée principal de l'application

import { LoginManager } from './login.js';
import { ContactsManager } from './contacts.js';

class App {
  constructor() {
    // Configuration de l'URL backend
    this.API_BASE_URL = "https://json-server-vzzw.onrender.com";
    
    // Initialisation des modules
    this.loginManager = null;
    this.contactsManager = null;
    
    this.init();
  }

  init() {
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupApp();
      });
    } else {
      this.setupApp();
    }
  }

  setupApp() {
    // Initialisation des gestionnaires de menus contextuels
    this.setupDropdownMenus();
    
    // Initialisation des modules
    this.loginManager = new LoginManager(this.API_BASE_URL);
    this.contactsManager = new ContactsManager(this.API_BASE_URL);
    
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

    // Fermeture des menus au clic sur le body
    document.body.addEventListener('click', () => {
      if (menuDropdown) menuDropdown.classList.add('hidden');
      if (actionsMenuDropdown) actionsMenuDropdown.classList.add('hidden');
    });
  }

  // Méthodes utilitaires pour accéder aux modules depuis l'extérieur
  getLoginManager() {
    return this.loginManager;
  }

  getContactsManager() {
    return this.contactsManager;
  }

  getApiBaseUrl() {
    return this.API_BASE_URL;
  }
}

// Initialisation de l'application
const app = new App();

// Exposition globale pour le debugging (optionnel)
window.app = app;