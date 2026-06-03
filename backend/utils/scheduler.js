const cron         = require("node-cron");
const Appointment  = require("../models/Appointment");
const CustomReminder = require("../models/CustomReminder");
const notifStore   = require("./notificationStore");

// Formate une date en heure lisible au format français "HH:MM"
const fmtTime = d => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Cherche les rendez-vous prévus dans exactement 4 heures et envoie une notification de rappel à la patiente
async function sendAppointmentReminders() {
  try {
    const now    = Date.now();
    const FOUR_H = 4 * 60 * 60 * 1000;
    const WINDOW = 60 * 1000;

    const upcoming = await Appointment.find({
      date:         { $gte: new Date(now + FOUR_H - WINDOW), $lte: new Date(now + FOUR_H + WINDOW) },
      reminderSent: false
    });

    for (const appt of upcoming) {
      notifStore.push(appt.patientId, {
        type:          "appointment",
        appointmentId: appt._id.toString(),
        message:       `Rappel : rendez-vous avec ${appt.medecin || "votre médecin"} dans 4 heures — ${fmtTime(appt.date)} (${appt.type || "Consultation"}).`
      });
      await Appointment.findByIdAndUpdate(appt._id, { reminderSent: true });
    }

    if (upcoming.length) console.log(`[Scheduler] Appointment reminders pushed: ${upcoming.length}`);
  } catch (err) {
    console.error("[Scheduler] Appointment reminder error:", err.message);
  }
}

// Parcourt toutes les alarmes actives et déclenche celles dont l'heure programmée correspond à la minute actuelle
async function sendCustomAlarms() {
  try {
    const now    = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const TOL    = 1;

    const active = await CustomReminder.find({ active: true });
    let fired = 0;

    for (const rem of active) {
      let shouldFire = false;

      if (rem.repeatType === "once" && rem.date) {
        const diff = Math.abs(rem.date.getTime() - now.getTime());
        if (diff <= TOL * 60 * 1000 && !rem.lastFiredAt) shouldFire = true;

      } else if (rem.repeatType === "daily" && rem.time) {
        const [h, m] = rem.time.split(":").map(Number);
        if (Math.abs(nowMin - (h * 60 + m)) <= TOL) {
          const notRecent = !rem.lastFiredAt || (now - rem.lastFiredAt) > 30 * 60 * 1000;
          if (notRecent) shouldFire = true;
        }

      } else if (rem.repeatType === "weekly" && rem.time && rem.days?.length) {
        const [h, m] = rem.time.split(":").map(Number);
        if (rem.days.includes(now.getDay()) && Math.abs(nowMin - (h * 60 + m)) <= TOL) {
          const notRecent = !rem.lastFiredAt || (now - rem.lastFiredAt) > 30 * 60 * 1000;
          if (notRecent) shouldFire = true;
        }
      }

      if (shouldFire) {
        notifStore.push(rem.patientId, {
          type:    "alarm",
          message: rem.label
        });
        await CustomReminder.findByIdAndUpdate(rem._id, {
          lastFiredAt: now,
          ...(rem.repeatType === "once" ? { active: false } : {})
        });
        fired++;
      }
    }

    if (fired) console.log(`[Scheduler] Custom alarms fired: ${fired}`);
  } catch (err) {
    console.error("[Scheduler] Alarm error:", err.message);
  }
}

// Démarre le planificateur qui exécute les rappels de rendez-vous et les alarmes personnalisées toutes les minutes
function startScheduler() {
  cron.schedule("* * * * *", async () => {
    await sendAppointmentReminders();
    await sendCustomAlarms();
  }, { timezone: "Africa/Tunis" });

  console.log("[Scheduler] Started — running every minute");
}

module.exports = { startScheduler };
