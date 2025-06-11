// register.js - Gestion de la création de compte utilisateur

export class RegisterManager {
  constructor(apiBaseUrl) {
    this.API_BASE_URL = apiBaseUrl;
    this.init();
  }

  init() {
    this.setupRegisterForm();
    this.setupFormSwitching();
    this.setupRealTimeValidation();
  }

  setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', this.handleRegister.bind(this));
    }
  }

  setupFormSwitching() {
    // Afficher le formulaire d'inscription
    const showRegisterLink = document.getElementById('showRegisterForm');
    if (showRegisterLink) {
      showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showRegisterForm();
      });
    }

    // Retour au formulaire de connexion
    const backToLoginLink = document.getElementById('backToLogin');
    if (backToLoginLink) {
      backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginForm();
      });
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const registerError = document.getElementById('registerError');
    
    // Réinitialiser les erreurs
    registerError.textContent = "";
    
    // Validation des champs
    if (!username || !phone) {
      this.showError("Veuillez remplir tous les champs.");
      return;
    }
    
    // Validation du nom d'utilisateur
    if (username.length < 3) {
      this.showError("Le nom d'utilisateur doit contenir au moins 3 caractères.");
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      this.showError("Le nom d'utilisateur ne peut contenir que des lettres, chiffres et _.");
      return;
    }
    
    // Validation du téléphone sénégalais
    if (!this.isValidPhone(phone)) {
      this.showError("Format de téléphone invalide (ex: 771234567).");
      return;
    }
    
    try {
      // Afficher un indicateur de chargement
      this.showLoading(true);
      
      // Vérifier si l'utilisateur existe déjà
      const userExists = await this.checkUserExists(username);
      if (userExists) {
        this.showError("Ce nom d'utilisateur existe déjà.");
        return;
      }
      
      // Vérifier si le téléphone existe déjà
      const phoneExists = await this.checkPhoneExists(phone);
      if (phoneExists) {
        this.showError("Ce numéro de téléphone est déjà utilisé.");
        return;
      }
      
      // Créer le nouvel utilisateur
      const newUser = {
        username: username,
        phone: phone,
        createdAt: new Date().toISOString(),
        isAdmin: false,
        isActive: true
      };
      
      const createdUser = await this.createUser(newUser);
      
      if (createdUser) {
        console.log("Utilisateur créé avec succès :", createdUser);
        this.showSuccessNotification(`Compte créé avec succès ! Bienvenue ${username}`);
        this.clearRegisterForm();
        this.showLoginForm();
      }
      
    } catch (err) {
      this.showError("Erreur de connexion au serveur.");
      console.error("Erreur lors de l'inscription :", err);
    } finally {
      this.showLoading(false);
    }
  }

  // Vérifier si un nom d'utilisateur existe déjà
  async checkUserExists(username) {
    try {
      const checkUserUrl = `${this.API_BASE_URL}/users?username=${encodeURIComponent(username)}`;
      const response = await fetch(checkUserUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const existingUsers = await response.json();
      return existingUsers.length > 0;
    } catch (err) {
      console.error("Erreur lors de la vérification de l'utilisateur :", err);
      throw err;
    }
  }

  // Vérifier si un numéro de téléphone existe déjà
  async checkPhoneExists(phone) {
    try {
      const checkPhoneUrl = `${this.API_BASE_URL}/users?phone=${encodeURIComponent(phone)}`;
      const response = await fetch(checkPhoneUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const existingPhones = await response.json();
      return existingPhones.length > 0;
    } catch (err) {
      console.error("Erreur lors de la vérification du téléphone :", err);
      throw err;
    }
  }

  // Créer un nouvel utilisateur
  async createUser(userData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (_) {}
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error("Erreur lors de la création de l'utilisateur :", err);
      throw err;
    }
  }

  // Valider le format du téléphone sénégalais
  isValidPhone(phone) {
    // Format sénégalais : commence par 7, 9 chiffres au total
    const phoneRegex = /^7[0-9]{8}$/;
    return phoneRegex.test(phone);
  }

  // Afficher le formulaire d'inscription
  showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm && registerForm) {
      loginForm.style.display = 'none';
      registerForm.classList.remove('hidden');
      registerForm.style.display = 'block';
    }
  }

  // Afficher le formulaire de connexion
  showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm && registerForm) {
      registerForm.classList.add('hidden');
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
    }
  }

  // Effacer le formulaire d'inscription
  clearRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.reset();
    }
    const registerError = document.getElementById('registerError');
    if (registerError) {
      registerError.textContent = '';
    }
  }

  // Afficher une erreur
  showError(message) {
    const registerError = document.getElementById('registerError');
    if (registerError) {
      registerError.textContent = message;
      registerError.style.color = '#ef4444';
    }
  }

  // Afficher/masquer l'indicateur de chargement
  showLoading(show) {
    const submitButton = document.querySelector('#registerForm button[type="submit"]');
    if (submitButton) {
      if (show) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Création en cours...';
      } else {
        submitButton.disabled = false;
        submitButton.innerHTML = 'S\'inscrire';
      }
    }
  }

  // Afficher une notification de succès
  showSuccessNotification(message) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'fixed top-4 right-4 bg-[#25d366] text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.style.opacity = "1";
    notification.style.transform = "translateX(0)";

    document.body.appendChild(notification);

    // Animation d'entrée (optionnelle)
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Supprimer la notification après 4 secondes
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  // Méthode utilitaire pour obtenir les statistiques d'inscription
  async getRegistrationStats() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/users`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const users = await response.json();
      return {
        totalUsers: users.length,
        recentUsers: users.filter(user => {
          const createdAt = new Date(user.createdAt);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return createdAt > oneWeekAgo;
        }).length
      };
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques :", err);
      return { totalUsers: 0, recentUsers: 0 };
    }
  }

  // Méthode de validation en temps réel
  setupRealTimeValidation() {
    const usernameInput = document.getElementById('registerUsername');
    const phoneInput = document.getElementById('registerPhone');

    if (usernameInput) {
      usernameInput.addEventListener('input', this.validateUsername.bind(this));
    }
    if (phoneInput) {
      phoneInput.addEventListener('input', this.validatePhone.bind(this));
    }
  }

  validateUsername(e) {
    const username = e.target.value.trim();
    const isValid = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
    e.target.style.borderColor = isValid ? '#25d366' : '#ef4444';
  }

  validatePhone(e) {
    const phone = e.target.value.trim();
    const isValid = this.isValidPhone(phone);
    e.target.style.borderColor = isValid ? '#25d366' : '#ef4444';
  }
}