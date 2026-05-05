// Routes du chatbot IA — gestion des sessions de conversation et des messages
// Toutes les routes sont réservées aux patientes sauf /share/:token qui est publique
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const chatbotCtrl = require("../controllers/chatbot.controller");

// Raccourci pour les routes nécessitant une authentification patiente
const isPatient = [auth, authorize("patiente")];

// Gestion des sessions de conversation
router.post("/sessions", isPatient, chatbotCtrl.createSession);          // Crée une nouvelle session
router.get("/sessions", isPatient, chatbotCtrl.getMySessions);            // Liste les sessions de la patiente
router.put("/sessions/:id/close",  isPatient, chatbotCtrl.closeSession); // Ferme une session active
router.delete("/sessions/:id",     isPatient, chatbotCtrl.deleteSession); // Supprime une session et ses messages

// Gestion des messages dans une session
router.post("/sessions/:id/messages", isPatient, chatbotCtrl.sendMessage); // Envoie un message et reçoit une réponse IA
router.get("/sessions/:id/messages", isPatient, chatbotCtrl.getMessages);  // Récupère l'historique des messages

// Analyse IA des symptômes déclarés → génère des recommandations personnalisées
router.post("/analyser-symptomes", isPatient, chatbotCtrl.analyserSymptomes);

// Initialise une session chatbot pré-chargée avec les symptômes actuels → analyse préliminaire + suggestions
router.post("/initialize", isPatient, chatbotCtrl.initializeWithSymptoms);

// Génère un lien de partage public pour une session (token unique)
router.post("/sessions/:id/share", isPatient, chatbotCtrl.shareSession);

// Accès public en lecture seule à une session partagée via son token (sans authentification)
router.get("/share/:token", chatbotCtrl.getSharedSession);

module.exports = router;
