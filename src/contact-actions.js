// src/contact-actions.js

// Stocke l'id du contact sélectionné dans le DOM (body)
function setSelectedContactId(contactId) {
  document.body.setAttribute('data-selected-contact-id', contactId);
}
function getSelectedContactId() {
  return document.body.getAttribute('data-selected-contact-id');
}

// Sélection du contact dans la liste (même après un re-render)
export function setupContactSelection() {
  const contactsList = document.getElementById('contactsList');
  if (!contactsList) return;

  contactsList.addEventListener('click', function(e) {
    const contactDiv = e.target.closest('.contact-item');
    if (contactDiv) {
      setSelectedContactId(contactDiv.getAttribute('data-contact-id'));

      // Surlignage visuel (optionnel)
      document.querySelectorAll('.contact-item').forEach(item => item.classList.remove('active'));
      contactDiv.classList.add('active');

      // Affiche le nom du contact sélectionné dans l'en-tête (zone currentContact si besoin)
      const currentContact = document.getElementById('currentContact');
      if (currentContact) {
        const nameElem = currentContact.querySelector('h3');
        if (nameElem) nameElem.textContent = contactDiv.textContent.trim();
        // Ici tu peux aussi mettre à jour le numéro ou l'avatar selon tes besoins
      }
    }
  });
}

// Affichage d'un message doux (snackbar)
function showInfoMessage(msg, duration = 3000) {
  let snackbar = document.getElementById('snackbar');
  if (!snackbar) {
    snackbar = document.createElement('div');
    snackbar.id = 'snackbar';
    snackbar.style.position = 'fixed';
    snackbar.style.bottom = '30px';
    snackbar.style.left = '50%';
    snackbar.style.transform = 'translateX(-50%)';
    snackbar.style.background = '#232d35';
    snackbar.style.color = '#fff';
    snackbar.style.padding = '14px 30px';
    snackbar.style.borderRadius = '8px';
    snackbar.style.fontSize = '1rem';
    snackbar.style.zIndex = '9999';
    snackbar.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
    snackbar.style.opacity = '0';
    snackbar.style.transition = 'opacity 0.3s';
    document.body.appendChild(snackbar);
  }
  snackbar.textContent = msg;
  snackbar.style.opacity = '1';
  clearTimeout(snackbar._timeout);
  snackbar._timeout = setTimeout(() => {
    snackbar.style.opacity = '0';
  }, duration);
}

// Actions du menu contextuel
export function setupContactMenuActions(apiBaseUrl = "https://json-server-vzzw.onrender.com") {
  document.getElementById('supprimerBtn')?.addEventListener('click', async () => {
    const contactId = getSelectedContactId();
    // DEBUG: log l'id pour vérifier
    // console.log('supprimerBtn contactId:', contactId);

    if (contactId) {
      await supprimerConversation(contactId, apiBaseUrl);
    } else {
      showInfoMessage("Sélectionne un contact d'abord !");
    }
  });

  document.getElementById('archiveBtn')?.addEventListener('click', async () => {
    const contactId = getSelectedContactId();
    // console.log('archiveBtn contactId:', contactId);

    if (contactId) {
      await archiverConversation(contactId, apiBaseUrl);
    } else {
      showInfoMessage("Sélectionne un contact d'abord !");
    }
  });

  document.getElementById('blockBtn')?.addEventListener('click', async () => {
    const contactId = getSelectedContactId();
    // console.log('blockBtn contactId:', contactId);

    if (contactId) {
      await bloquerContact(contactId, apiBaseUrl);
    } else {
      showInfoMessage("Sélectionne un contact d'abord !");
    }
  });

  document.getElementById('deleteBtn')?.addEventListener('click', async () => {
    const contactId = getSelectedContactId();
    // console.log('deleteBtn contactId:', contactId);

    if (contactId) {
      if (confirm('Supprimer définitivement la conversation ?')) {
        await supprimerDefinitivementConversation(contactId, apiBaseUrl);
      }
    } else {
      showInfoMessage("Sélectionne un contact d'abord !");
    }
  });
}

// Appelle l'API pour supprimer la conversation
async function supprimerConversation(contactId, apiBaseUrl) {
  try {
    const resp = await fetch(`${apiBaseUrl}/conversations/${contactId}`, { method: 'DELETE' });
    if (resp.ok) {
      removeContactFromList(contactId);
      showInfoMessage("Conversation supprimée !");
    } else {
      showInfoMessage("Erreur lors de la suppression de la conversation.");
    }
  } catch (e) {
    showInfoMessage("Erreur réseau lors de la suppression.");
  }
}

// Appelle l'API pour archiver la conversation
async function archiverConversation(contactId, apiBaseUrl) {
  try {
    const resp = await fetch(`${apiBaseUrl}/conversations/${contactId}`, {
      method: 'PATCH',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true })
    });
    if (resp.ok) {
      removeContactFromList(contactId);
      showInfoMessage("Conversation archivée !");
    } else {
      showInfoMessage("Erreur lors de l'archivage.");
    }
  } catch (e) {
    showInfoMessage("Erreur réseau lors de l'archivage.");
  }
}

// Appelle l'API pour bloquer le contact
async function bloquerContact(contactId, apiBaseUrl) {
  try {
    const resp = await fetch(`${apiBaseUrl}/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked: true })
    });
    if (resp.ok) {
      removeContactFromList(contactId);
      showInfoMessage("Contact bloqué !");
    } else {
      showInfoMessage("Erreur lors du blocage.");
    }
  } catch (e) {
    showInfoMessage("Erreur réseau lors du blocage.");
  }
}

// Supprimer définitivement la conversation
async function supprimerDefinitivementConversation(contactId, apiBaseUrl) {
  try {
    const convResp = await fetch(`${apiBaseUrl}/conversations/${contactId}`, { method: 'DELETE' });
    const contactResp = await fetch(`${apiBaseUrl}/contacts/${contactId}`, { method: 'DELETE' });
    if (convResp.ok && contactResp.ok) {
      removeContactFromList(contactId);
      showInfoMessage("Conversation et contact supprimés !");
    } else {
      showInfoMessage("Erreur lors de la suppression définitive.");
    }
  } catch (e) {
    showInfoMessage("Erreur réseau lors de la suppression définitive.");
  }
}

// Retire le contact de la liste à l'écran
function removeContactFromList(contactId) {
  const elem = document.querySelector(`.contact-item[data-contact-id="${contactId}"]`);
  if (elem) {
    elem.remove();
  }
  // Vider la zone de messages si le contact était affiché
  const messagesList = document.getElementById('messagesList');
  if (messagesList) messagesList.innerHTML = "";
  const currentContact = document.getElementById('currentContact');
  if (currentContact) {
    currentContact.querySelector('h3').textContent = "";
    currentContact.querySelector('p').textContent = "";
  }
  // Réinitialise aussi l'attribut sur le body
  document.body.removeAttribute('data-selected-contact-id');
}