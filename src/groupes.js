// groups.js - Gestion des groupes (création, édition, membres) pour l'app WhatsApp-like

export class GroupsManager {
  constructor(apiBaseUrl, currentUser, contactsManager) {
    this.API_BASE_URL = apiBaseUrl;
    this.currentUser = currentUser; // {id, username, ...}
    this.contactsManager = contactsManager; // instance pour lister les contacts
    this.groups = [];
    this.selectedGroup = null; // Pour édition
    this.init();
  }

  init() {
    this.setupGroupModal();
    this.fetchGroups();

    // Rafraîchir les groupes à la création/édition (event global si besoin)
    document.addEventListener('groupModified', () => this.fetchGroups());
  }

  setupGroupModal() {
    // Ouvre la modale de création de groupe
    const btnNewGroup = document.getElementById('btnNewGroup');
    if (btnNewGroup) {
      btnNewGroup.addEventListener('click', (e) => {
        e.preventDefault();
        this.openGroupModal();
      });
    }

    // Ferme la modale si clique sur l'overlay ou bouton croix
    const modal = document.getElementById('createGroupModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }
    const closeModalBtn = document.getElementById('closeGroupModalBtn');
    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    // Soumission du formulaire de création ou édition
    const createGroupForm = document.getElementById('createGroupForm');
    if (createGroupForm) {
      createGroupForm.addEventListener('submit', (e) => this.handleSubmitGroup(e));
    }
  }

  openGroupModal(group = null) {
    this.selectedGroup = group;
    const modal = document.getElementById('createGroupModal');
    const errorDiv = document.getElementById('groupError');
    const groupNameInput = document.getElementById('groupName');
    errorDiv.textContent = "";
    modal.classList.remove('hidden');

    // Pré-remplir si édition
    if (group) {
      groupNameInput.value = group.name;
      this.renderMembersSelector(group.members, group.adminId);
      document.getElementById('groupModalTitle').textContent = "Renommer/Modifier le groupe";
      document.getElementById('groupSubmitBtn').textContent = "Mettre à jour";
    } else {
      groupNameInput.value = "";
      // Par défaut, sélectionne l'admin et demande 1+ membre
      this.renderMembersSelector([this.currentUser.id], this.currentUser.id);
      document.getElementById('groupModalTitle').textContent = "Créer un groupe";
      document.getElementById('groupSubmitBtn').textContent = "Créer";
    }
  }

  renderMembersSelector(selectedIds = [], adminId = null) {
    // Suppose que tu as un <div id="groupMembersSelector"></div> dans la modale
    const container = document.getElementById('groupMembersSelector');
    if (!container || !this.contactsManager) return;
    const contacts = this.contactsManager.contacts || [];
    container.innerHTML = "";

    // Sélectionner les membres (checkbox)
    contacts.forEach(contact => {
      const isAdmin = adminId ? contact.id === adminId : contact.id === this.currentUser.id;
      const checked = selectedIds.includes(contact.id) || isAdmin;
      const disabled = isAdmin;
      const div = document.createElement('div');
      div.className = "flex items-center gap-2 mb-2";
      div.innerHTML = `
        <input type="checkbox" class="group-member-checkbox" value="${contact.id}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}/>
        <span>${contact.name} (${contact.phone})${isAdmin ? " <span class='text-xs text-[#25d366]'>(admin)</span>" : ""}</span>
      `;
      container.appendChild(div);
    });
  }

  async handleSubmitGroup(e) {
    e.preventDefault();
    const name = document.getElementById('groupName').value.trim();
    const errorDiv = document.getElementById('groupError');
    const modal = document.getElementById('createGroupModal');
    errorDiv.textContent = "";

    // Récupérer membres sélectionnés (toujours inclure l'admin/créateur)
    const checkboxes = document.querySelectorAll('.group-member-checkbox');
    let memberIds = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    // S'assurer que l'admin est dans la liste
    let adminId = this.selectedGroup && this.selectedGroup.adminId
      ? this.selectedGroup.adminId
      : this.currentUser.id;
    if (!memberIds.includes(String(adminId))) {
      memberIds.unshift(String(adminId));
    }

    // Validation
    if (!name) {
      errorDiv.textContent = "Le nom du groupe est obligatoire.";
      return;
    }
    if (memberIds.length < 2) {
      errorDiv.textContent = "Le groupe doit contenir au moins 2 membres (admin inclus).";
      return;
    }

    try {
      if (this.selectedGroup) {
        // Edition du groupe
        await this.editGroup(this.selectedGroup.id, { name, members: memberIds });
      } else {
        // Création
        await this.createGroup({
          name,
          createdAt: new Date().toISOString(),
          members: memberIds,
          adminId: adminId
        });
      }
      modal.classList.add('hidden');
      document.getElementById('createGroupForm').reset();
      document.dispatchEvent(new Event('groupModified'));
    } catch (err) {
      errorDiv.textContent = "Erreur lors de l'enregistrement du groupe.";
    }
  }

  async createGroup(groupData) {
    const response = await fetch(`${this.API_BASE_URL}/groups`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(groupData)
    });
    if (!response.ok) throw new Error();
    return await response.json();
  }

  async editGroup(id, data) {
    const response = await fetch(`${this.API_BASE_URL}/groups/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error();
    return await response.json();
  }

  async fetchGroups() {
    try {
      const res = await fetch(`${this.API_BASE_URL}/groups`);
      this.groups = await res.json();
      this.renderGroups();
    } catch (err) {
      console.error("Erreur lors du chargement des groupes", err);
    }
  }

  renderGroups() {
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) return;
    groupsList.innerHTML = "";
    if (this.groups.length === 0) {
      groupsList.innerHTML = `<div class="text-gray-400 italic px-3">Aucun groupe</div>`;
      return;
    }
    this.groups.forEach(group => {
      const div = document.createElement('div');
      div.className = "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#232d35] cursor-pointer";
      div.innerHTML = `
        <span class="bg-[#25d366] w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-lg">
          ${group.name[0] ? group.name[0].toUpperCase() : "G"}
        </span>
        <span class="font-semibold text-white">${group.name}</span>
        <button class="ml-auto text-xs text-[#25d366] underline edit-group-btn" data-group-id="${group.id}">Gérer</button>
      `;
      div.querySelector('.edit-group-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openGroupModal(group);
      });
      div.addEventListener('click', () => this.showGroupDetails(group));
      groupsList.appendChild(div);
    });
  }

  showGroupDetails(group) {
    // Ouvre une modale d'information sur le groupe avec gestion des membres
    // Pour l'exemple, tu peux remplacer ce alert par une vraie modale d'info
    let msg = `Groupe : ${group.name}\n\nMembres:\n`;
    if (!this.contactsManager) return;
    const contacts = this.contactsManager.contacts || [];
    group.members.forEach(id => {
      const user = contacts.find(c => String(c.id) === String(id)) || { name: 'Inconnu', phone: '' };
      msg += `- ${user.name} (${user.phone})${id == group.adminId ? " (admin)" : ""}\n`;
    });
    alert(msg);
    // Pour aller plus loin, affiche une modale pour renommer, ajouter/retirer des membres, etc.
  }

  // Ajoute un membre (si admin)
  async addMemberToGroup(groupId, userId) {
    const group = this.groups.find(g => g.id == groupId);
    if (!group) return;
    if (!group.members.includes(userId)) {
      const members = Array.from(new Set([...group.members, userId]));
      await this.editGroup(groupId, { members });
      this.fetchGroups();
    }
  }

  // Retire un membre (si admin, sauf admin lui-même)
  async removeMemberFromGroup(groupId, userId) {
    const group = this.groups.find(g => g.id == groupId);
    if (!group) return;
    if (userId == group.adminId) return alert("Impossible de retirer l'admin.");
    const members = group.members.filter(id => id !== userId);
    await this.editGroup(groupId, { members });
    this.fetchGroups();
  }
}