// login.js - Gestion de l'authentification utilisateur

export class LoginManager {
  constructor(apiBaseUrl) {
    this.API_BASE_URL = apiBaseUrl;
    this.init();
  }

  init() {
    this.setupLoginForm();
    this.setupLogout();
  }

  setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }
  }

  setupLogout() {
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const loginError = document.getElementById('loginError');
    
    if (username && phone) {
      try {
        const baseUrl = `${this.API_BASE_URL}/users`; 
        const query = `?username=${encodeURIComponent(username)}&phone=${encodeURIComponent(phone)}`;
        const res = await fetch(baseUrl + query);
        const users = await res.json();
        console.log("avant :", users[0]?.username);

        if (users.length > 0) {
          document.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: { user: users[0] }
          }));
          this.showApp();
          loginError.textContent = "";
          console.log("Connexion réussie pour l'utilisateur :", users[0].username);
        } else {
          loginError.textContent = "Nom d'utilisateur ou numéro incorrect.";
          console.log("Échec de la connexion : utilisateur non trouvé.");
        }
      } catch (err) {
        loginError.textContent = "Erreur de connexion au serveur.";
        console.log("Erreur lors de la connexion :", err);
      }
    } else {
      loginError.textContent = "Merci de remplir tous les champs.";
    }
  }

  handleLogout(e) {
    e.preventDefault();
    this.showLogin();
    document.dispatchEvent(new Event('userLoggedOut'));
  }

  showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appContainer').style.display = '';
  }

  showLogin() {
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginPage').style.display = '';
  }
}