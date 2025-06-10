export function validerNumeroTelephone(numero) {
    const numeroNettoye = numero.replace(/\D/g, '');
    if (numeroNettoye.length < 8 || numeroNettoye.length > 15) {
        return { valide: false, message: 'Le numéro doit contenir entre 8 et 15 chiffres' };
    }
    return { valide: true, numero: numeroNettoye };
}
export function numeroExiste(numero) {
    return appData.contacts.some(contact => contact.telephone === numero);
}
export function formaterNumero(numero) {
    if (numero.length === 10 && numero.startsWith('0')) {
        return numero.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    } else if (numero.length === 9) {
        return numero.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }
    return numero;
}

export function afficherMessageGlobal(message, type = 'success') {
    let couleur = {
        success: 'bg-green-100 text-green-700 border-green-400',
        error: 'bg-red-100 text-red-700 border-red-400',
        info: 'bg-blue-100 text-blue-700 border-blue-400',
        warning: 'bg-yellow-100 text-yellow-700 border-yellow-400'
    }[type] || 'bg-gray-100 text-gray-700 border-gray-400';

    const oldMsg = document.getElementById('globalMessage');
    if (oldMsg) oldMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.id = 'globalMessage';
    msgDiv.className = `p-3 border ${couleur} rounded mb-4 text-center animate-fade-in`;
    msgDiv.textContent = message;

    const mainSection = document.querySelector('section');
    if (mainSection) mainSection.prepend(msgDiv);

    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}
