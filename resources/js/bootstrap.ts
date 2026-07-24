import axios from 'axios';

// On expose axios en global (window.axios) — pratique et attendu par
// certaines briques Laravel. La déclaration ci-dessous évite l'erreur
// TypeScript "la propriété 'axios' n'existe pas sur Window".
declare global {
    interface Window {
        axios: typeof axios;
    }
}

window.axios = axios;

// En-tête qui indique au back Laravel qu'il s'agit d'une requête AJAX/XHR.
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
