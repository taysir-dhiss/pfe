// Client Socket.io — gère la connexion/déconnexion pour le chat communautaire en temps réel
// Se connecte directement au backend (contourne le proxy CRA car WebSocket ne supporte pas les proxies HTTP)
import { io } from "socket.io-client";

// URL du serveur Socket.io — configurable via variable d'environnement
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

// Instance Socket.io partagée (singleton) — null si non connecté
let socket = null;

// Crée une connexion Socket.io avec le token JWT pour l'authentification côté serveur
export function connectSocket(token) {
  if (socket?.connected) return socket; // Réutilise la connexion existante si déjà connecté

  socket = io(SOCKET_URL, {
    auth: { token },                          // Token JWT envoyé au middleware d'auth Socket.io
    transports: ["websocket", "polling"],      // WebSocket en priorité, HTTP long-polling en fallback
    reconnectionAttempts: 10,                  // Nombre de tentatives de reconnexion
    reconnectionDelay: 1500,                   // Délai initial entre deux tentatives (ms)
    reconnectionDelayMax: 8000,                // Délai maximal entre deux tentatives (ms)
  });

  return socket;
}

// Retourne l'instance socket actuelle (peut être null si non connecté)
export function getSocket() {
  return socket;
}

// Ferme la connexion Socket.io et libère la référence
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
