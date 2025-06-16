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

    // Nouvelle logique : si un utilisateur est déjà connecté, on le restaure !
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      // On simule un "userLoggedIn" pour tout initialiser sans repasser par le formulaire
      const user = JSON.parse(userData);
      document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user } }));
      // Masquer le formulaire login, afficher l'app principale
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('appContainer').style.display = '';
    } else {
      // Aucun utilisateur connecté, on affiche le formulaire login
      document.getElementById('appContainer').style.display = 'none';
      document.getElementById('loginPage').style.display = '';
    }

    // Pour debugging
    window.loginManager = this.loginManager;
    window.registerManager = this.registerManager;

    console.log('Application initialisée avec succès');
  }

  setupLoginEventListeners() {
    document.addEventListener('userLoggedIn', (event) => {
      this.currentUser = event.detail.user;

      // Stocker l'utilisateur dans localStorage pour la persistance !
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      this.contactsManager = new ContactsManager(this.API_BASE_URL, this.currentUser);
      this.groupsManager = new GroupsManager(this.API_BASE_URL, this.currentUser, this.contactsManager);
      this.messagesManager = new MessagesManager(this.API_BASE_URL, this.currentUser, this.contactsManager);

      // Connexion entre la sélection du contact et l'affichage des messages
      this.contactsManager.onContactSelected = (contactId) => {
        this.messagesManager.selectContact(contactId);
      };

      window.contactsManager = this.contactsManager;
      window.groupsManager = this.groupsManager;
      window.messagesManager = this.messagesManager;

      // Afficher la liste des discussions au login
      this.showDiscussionsPanel();
    });

    document.addEventListener('userLoggedOut', () => {
      // Nettoyer le polling avant de déconnecter
      if (this.messagesManager) {
        this.messagesManager.cleanup();
      }

      // Supprimer l'utilisateur du localStorage
      localStorage.removeItem('currentUser');

      this.currentUser = null;
      this.contactsManager = null;
      this.groupsManager = null;
      this.messagesManager = null;

      // Nettoyer l'affichage si besoin
      const contactsList = document.getElementById('contactsList');
      if (contactsList) contactsList.innerHTML = "";
      const allContactsList = document.getElementById('allContactsList');
      if (allContactsList) allContactsList.innerHTML = "";
      const messagesList = document.getElementById('messagesList');
      if (messagesList) messagesList.innerHTML = "";

      // Afficher la page de login, masquer l'app principale
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
      // Bouton "Discussions" (icône bulle)
      const discussionsBtn = document.querySelector('button[title="Discussions"]');
      if (discussionsBtn) {
        discussionsBtn.addEventListener('click', () => {
          this.showDiscussionsPanel();
        });
      }
      // Tu peux ajouter d'autres boutons ici si tu veux masquer/afficher d'autres panels
    });
  }

  showDiscussionsPanel() {
    // Affiche uniquement la liste des discussions (contactsList)
    const contactsPanel = document.getElementById('contactsList');
    if (contactsPanel) contactsPanel.parentElement.classList.remove('hidden');
    // Masque la liste des groupes si besoin
    const groupsList = document.getElementById('groupsList');
    if (groupsList) groupsList.classList.add('hidden');
    // Affiche le contactsList (au cas où il serait masqué)
    if (contactsPanel) contactsPanel.classList.remove('hidden');
    // Recharge la liste des contacts/discussions si besoin
    if (this.contactsManager) {
      this.contactsManager.renderContacts();
    }
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

document.addEventListener('DOMContentLoaded', () => {
  // Sélectionne les boutons
  const allBtn = document.getElementById('filterAllBtn');
  const unreadBtn = document.getElementById('filterUnreadBtn');
  const favoriteBtn = document.getElementById('filterFavoriteBtn');
  const groupsBtn = document.getElementById('filterGroupsBtn');

  // Helper pour changer l'état actif du bouton
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

  // Toutes
  allBtn.addEventListener('click', () => {
    setActiveBtn(allBtn);
    window.app.contactsManager.renderContacts(); // toutes les discussions
    document.getElementById('groupsList').classList.add('hidden');
    document.getElementById('contactsList').classList.remove('hidden');
  });

  // Non lues
  unreadBtn.addEventListener('click', () => {
    setActiveBtn(unreadBtn);
    window.app.contactsManager.renderContacts('', {unreadOnly: true});
    document.getElementById('groupsList').classList.add('hidden');
    document.getElementById('contactsList').classList.remove('hidden');
  });

  // Favoris
  favoriteBtn.addEventListener('click', () => {
    setActiveBtn(favoriteBtn);
    window.app.contactsManager.renderContacts('', {favoritesOnly: true});
    document.getElementById('groupsList').classList.add('hidden');
    document.getElementById('contactsList').classList.remove('hidden');
  });

  // Groupes
  groupsBtn.addEventListener('click', () => {
    setActiveBtn(groupsBtn);
    document.getElementById('contactsList').classList.add('hidden');
    document.getElementById('groupsList').classList.remove('hidden');
    // Tu peux ajouter une méthode renderGroups() si besoin
    if (window.app.groupsManager) window.app.groupsManager.renderGroups();
  });
});

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