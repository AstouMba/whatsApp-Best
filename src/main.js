// --- Gestion des menus contextuels ---
const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
menuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  menuDropdown.classList.toggle('hidden');
});
const actionsMenuBtn = document.getElementById('actionsMenuBtn');
const actionsMenuDropdown = document.getElementById('actionsMenuDropdown');
actionsMenuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  actionsMenuDropdown.classList.toggle('hidden');
});
document.body.addEventListener('click', function() {
  menuDropdown.classList.add('hidden');
  actionsMenuDropdown.classList.add('hidden');
});

// --- Authentification utilisateur ---
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const loginError = document.getElementById('loginError');
  
  if(username && phone) {
    try {
      const res = await fetch(`https://json-server-vzzw.onrender.com/users?username=${encodeURIComponent(username)}&phone=${encodeURIComponent(phone)}`);
      const users = await res.json();
      if(users.length > 0) {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appContainer').style.display = '';
        loginError.textContent = "";
      } else {
        loginError.textContent = "Nom d'utilisateur ou numéro incorrect.";
      }
    } catch (err) {
      loginError.textContent = "Erreur de connexion au serveur.";
    }
  } else {
    loginError.textContent = "Merci de remplir tous les champs.";
  }
});

// --- Gestion du menu principal ---
document.getElementById('btnNewGroup').addEventListener('click', function(e) {
  e.preventDefault();
  alert('Fonction "Nouveau groupe" à compléter.');
});
document.getElementById('btnNewContact').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('addContactSection').classList.remove('hidden');
});
document.getElementById('cancelAddContact').addEventListener('click', function() {
  document.getElementById('addContactSection').classList.add('hidden');
});
document.getElementById('btnArchives').addEventListener('click', function(e) {
  e.preventDefault();
  alert('Fonction "Archives" à compléter.');
});
document.getElementById('btnLogout').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('loginPage').style.display = '';
  // localStorage.removeItem('user'); // Optionnel
});

// --- Gestion des contacts (json-server) ---
let contacts = []; // Stocke les contacts de json-server

// Récupération des contacts depuis json-server
function fetchContacts() {
  fetch('https://json-server-vzzw.onrender.com/contacts')
    .then(res => res.json())
    .then(data => {
      contacts = data;
      renderContacts(); // Sidebar
      renderContactsSelector(); // Panneau "nouvelle discussion"
    });
}

// Affiche la liste des contacts dans la colonne principale (sidebar)
function renderContacts(filter = "") {
  const contactsList = document.getElementById('contactsList');
  contactsList.innerHTML = "";
  contacts
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
      contactsList.appendChild(div);
    });
}

// Affiche la liste des contacts dans le panneau "Nouvelle discussion"
function renderContactsSelector(filter = "") {
  const list = document.getElementById('allContactsList');
  if (!list) return;
  list.innerHTML = "";
  contacts
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
      list.appendChild(div);
    });
}

// Ajout d'un contact via le formulaire (json-server)
document.getElementById('addContactForm').addEventListener('submit', async function(e) {
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
    const response = await fetch('https://json-server-vzzw.onrender.com/contacts', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ name, phone, avatar })
    });
    if (!response.ok) throw new Error('Erreur réseau');
    document.getElementById('addContactForm').reset();
    document.getElementById('addContactSection').classList.add('hidden');
    errorDiv.textContent = "";
    fetchContacts(); // recharge la liste après ajout
  } catch (err) {
    errorDiv.textContent = "Erreur lors de l'ajout du contact.";
  }
});

// Recherche dans la sidebar principale
document.getElementById('searchContacts').addEventListener('input', function(e) {
  renderContacts(e.target.value);
});

// Recherche dans le panneau selector
const searchAllContacts = document.getElementById('searchAllContacts');
if (searchAllContacts) {
  searchAllContacts.addEventListener('input', function(e) {
    renderContactsSelector(e.target.value);
  });
}

// --- Panneau "Nouvelle discussion" ---
const nouveauChatBtn = document.querySelector('button[title="Nouveau chat"]');
if (nouveauChatBtn) {
  nouveauChatBtn.id = "openContactsSelector";
  nouveauChatBtn.addEventListener('click', function() {
    document.getElementById('contactsSelectorPanel').classList.remove('hidden');
    renderContactsSelector();
  });
}
const closeBtn = document.getElementById('closeContactsSelector');
if (closeBtn) {
  closeBtn.addEventListener('click', function() {
    document.getElementById('contactsSelectorPanel').classList.add('hidden');
  });
}

// Chargement initial des contacts
fetchContacts();