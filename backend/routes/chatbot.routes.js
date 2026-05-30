const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const chatbotCtrl = require("../controllers/chatbot.controller");

const isPatient = [auth, authorize("patiente")];

router.post("/sessions", isPatient, chatbotCtrl.createSession);
router.get("/sessions", isPatient, chatbotCtrl.getMySessions);
router.put("/sessions/:id/close",  isPatient, chatbotCtrl.closeSession);
router.delete("/sessions/:id",     isPatient, chatbotCtrl.deleteSession);

router.post("/sessions/:id/messages", isPatient, chatbotCtrl.sendMessage);
router.get("/sessions/:id/messages", isPatient, chatbotCtrl.getMessages);

router.post("/analyser-symptomes", isPatient, chatbotCtrl.analyserSymptomes);

router.post("/initialize", isPatient, chatbotCtrl.initializeWithSymptoms);

router.post("/sessions/:id/share", isPatient, chatbotCtrl.shareSession);

router.get("/share/:token", chatbotCtrl.getSharedSession);

module.exports = router;
