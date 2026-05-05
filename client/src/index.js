// Point d'entrée React — monte l'application dans la div #root du HTML public
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Styles globaux Tailwind
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode : active des vérifications supplémentaires en développement (double rendu, détection des effets obsolètes)
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mesure optionnelle des performances (Core Web Vitals)
// Passer une fonction pour enregistrer les résultats (ex: reportWebVitals(console.log))
reportWebVitals();
