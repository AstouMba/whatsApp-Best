// --- Gestion du formulaire d'inscription utilisateur ---

// Afficher le formulaire d'inscription
document.getElementById('showRegisterForm').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('loginForm').parentElement.style.display = 'none';
  document.getElementById('registerForm').classList.remove('hidden');
});

// Retour à la connexion
document.getElementById('backToLogin').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('loginForm').parentElement.style.display = '';
});

// Inscription (ajout d'utilisateur dans json-server)
document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const phone = document.getElementById('registerPhone').value.trim();
  const registerError = document.getElementById('registerError');

  if (!username || !phone) {
    registerError.textContent = "Merci de remplir tous les champs.";
    return;
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const res = await fetch(`https://json-server-vzzw.onrender.com/users?username=${encodeURIComponent(username)}&phone=${encodeURIComponent(phone)}`);
    const users = await res.json();
    if (users.length > 0) {
      registerError.textContent = "Cet utilisateur existe déjà.";
      return;
    }
    // Ajouter le nouvel utilisateur
    const addRes = await fetch('https://json-server-vzzw.onrender.com/users', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, phone })
    });
    if (!addRes.ok) throw new Error();
    registerError.textContent = "";
    alert("Compte créé avec succès ! Connectez-vous.");
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').parentElement.style.display = '';
  } catch (err) {
    registerError.textContent = "Erreur lors de l'inscription.";
  }
});