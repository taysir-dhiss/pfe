// Routes chatbot - sessions, messages, analyse symptômes (patient uniquement)
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const chatbotCtrl = require("../controllers/chatbot.controller");

const isPatient = [auth, authorize("patiente")];

// Sessions
router.post("/sessions", isPatient, chatbotCtrl.createSession);
router.get("/sessions", isPatient, chatbotCtrl.getMySessions);
router.put("/sessions/:id/close", isPatient, chatbotCtrl.closeSession);

// Messages
router.post("/sessions/:id/messages", isPatient, chatbotCtrl.sendMessage);
router.get("/sessions/:id/messages", isPatient, chatbotCtrl.getMessages);

// Analyse symptômes → recommandations IA
router.post("/analyser-symptomes", isPatient, chatbotCtrl.analyserSymptomes);

module.exports = router;
