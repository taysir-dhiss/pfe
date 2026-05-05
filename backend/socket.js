// Configuration de Socket.io pour les communications en temps réel
// Utilisé principalement pour le chat communautaire (diffusion de messages en temps réel)
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// Instance Socket.io partagée — initialisée une seule fois au démarrage
let io = null;

// Initialise le serveur Socket.io et attache-le au serveur HTTP fourni
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",          // Accepte toutes les origines (à restreindre en production)
      methods: ["GET", "POST"],
    },
    // Permet aux clients de se reconnecter automatiquement jusqu'à 30 secondes après une déconnexion
    connectionStateRecovery: { maxDisconnectionDuration: 30000 },
  });

  // Middleware d'authentification JWT — vérifié à chaque connexion Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token; // Token transmis par le client lors de la connexion
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attache les infos utilisateur décodées au socket
      next();
    } catch {
      next(new Error("Invalid token")); // Rejette la connexion si le token est invalide ou expiré
    }
  });

  io.on("connection", (socket) => {
    // Tous les utilisateurs authentifiés rejoignent la salle communautaire globale
    // Cela permet de diffuser les messages à tous via getIO().to("community").emit(...)
    socket.join("community");

    socket.on("disconnect", () => {});
  });

  return io;
}

// Retourne l'instance Socket.io existante — utilisée par les contrôleurs pour émettre des événements
function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { initSocket, getIO };
