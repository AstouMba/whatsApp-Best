// --- Gestion des contacts (json-server) ---
let contacts = []; // Stocke les contacts de json-server

// Récupération des contacts depuis json-server
export function fetchContacts() {
  fetch('http://localhost:3001/contacts')
    .then(res => res.json())
    .then(data => {
      contacts = data;
      renderContacts(); // Sidebar
      renderContactsSelector(); // Panneau "nouvelle discussion"
    });
}

// Affiche la liste des contacts dans la colonne principale (sidebar)
export function renderContacts(filter = "") {
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
export function renderContactsSelector(filter = "") {
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
export function setupAddContactForm() {
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
      const response = await fetch('http://localhost:3001/contacts', {
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
}

// Recherche dans la sidebar principale
export function setupSearchSidebar() {
  document.getElementById('searchContacts').addEventListener('input', function(e) {
    renderContacts(e.target.value);
  });
}

// Recherche dans le panneau selector
export function setupSearchSelector() {
  const searchAllContacts = document.getElementById('searchAllContacts');
  if (searchAllContacts) {
    searchAllContacts.addEventListener('input', function(e) {
      renderContactsSelector(e.target.value);
    });
  }
}