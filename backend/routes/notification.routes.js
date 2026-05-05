// Routes des notifications — stockage en mémoire RAM (pas de base de données)
// Les notifications sont générées par le planificateur (rappels de RDV et alarmes)
const express   = require("express");
const router    = express.Router();
const auth      = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ctrl      = require("../controllers/notification.controller");

const isPatient = [auth, authorize("patiente")];

router.get("/unread-count", isPatient, ctrl.getUnreadCount);  // Nombre de notifications non lues (pour le badge)
router.get("/",             isPatient, ctrl.getMyNotifications); // Liste toutes les notifications en attente
router.delete("/",          isPatient, ctrl.dismissAll);         // Supprimer toutes les notifications
router.delete("/:id",       isPatient, ctrl.dismiss);            // Supprimer une notification spécifique

module.exports = router;
