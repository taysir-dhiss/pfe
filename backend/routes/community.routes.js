// Routes du chat communautaire — lecture pour tous les utilisateurs authentifiés, écriture pour les patientes
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ctrl = require("../controllers/community.controller");

// Tout utilisateur connecté (admin ou patiente) peut lire les messages
const isAuthenticated = [auth];
// Seules les patientes peuvent publier, réagir ou supprimer des messages
const isPatient = [auth, authorize("patiente")];

// Lecture des messages (messages principaux + réponses imbriquées)
router.get("/messages", isAuthenticated, ctrl.getMessages);

// Publication d'un nouveau message (peut être une réponse si parentMessageId fourni)
router.post("/messages", isPatient, ctrl.postMessage);
// Toggle d'une réaction emoji sur un message
router.post("/messages/:id/react", isPatient, ctrl.reactToMessage);
// Suppression d'un message (uniquement le sien + ses réponses)
router.delete("/messages/:id", isPatient, ctrl.deleteMessage);

module.exports = router;
