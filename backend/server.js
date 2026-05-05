// Point d'entrée principal du serveur — connexion MongoDB, déclaration des routes, démarrage HTTP
const http = require("http");
const express = require("express");
const cors = require("cors");
const dns = require("node:dns/promises");
require("dotenv").config(); // Charge les variables d'environnement depuis .env

// Force la résolution DNS en IPv4 pour éviter les problèmes de connexion sur certains réseaux
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]); // Utilise les DNS publics de Google et Cloudflare

// Connexion à la base de données MongoDB
const connectDB = require("./connectdb");
// Middleware de gestion globale des erreurs
const errorHandler = require("./middleware/error.middleware");
// Initialisation de Socket.io pour les communications en temps réel
const { initSocket } = require("./socket");

// Import de toutes les routes de l'application
const authRoutes = require("./routes/auth.routes");           // Authentification (login, inscription)
const adminRoutes = require("./routes/admin.routes");         // Gestion admin
const patientRoutes = require("./routes/patient.routes");     // Profil patient
const symptomRoutes = require("./routes/symptom.routes");     // Suivi des symptômes
const appointmentRoutes = require("./routes/appointment.routes"); // Rendez-vous médicaux
const notificationRoutes = require("./routes/notification.routes"); // Notifications en mémoire
const contentRoutes = require("./routes/content.routes");     // Contenu médical (articles, vidéos)
const chatbotRoutes = require("./routes/chatbot.routes");     // Chatbot IA (sessions, messages)
const recommendationRoutes = require("./routes/recommendation.routes"); // Recommandations IA
const reminderRoutes = require("./routes/reminder.routes");   // Rappels personnalisés (médicaments, etc.)
const communityRoutes = require("./routes/community.routes"); // Chat communautaire
const ragRoutes       = require("./routes/rag.routes");       // RAG : indexation de PDFs médicaux

// Planificateur de tâches : envoie les rappels de RDV et les alarmes personnalisées chaque minute
const { startScheduler } = require("./utils/scheduler");

const app = express();
const httpServer = http.createServer(app); // Serveur HTTP wrappé pour supporter Socket.io

// Activation de CORS : autorise les requêtes cross-origin depuis le frontend React
app.use(cors());
// Permet de lire le corps des requêtes au format JSON
app.use(express.json());

// Déclaration des routes API — chaque préfixe correspond à un domaine fonctionnel
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/symptoms", symptomRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/chat", chatbotRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/rag",       ragRoutes);

// Route de santé — vérifie que le serveur tourne
app.get("/", (_req, res) => res.send("Backend is running"));

// Middleware d'erreur global — intercepte toutes les erreurs non gérées
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Gestion de l'erreur EADDRINUSE : si le port est déjà utilisé, tue le processus occupant et réessaie
httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`[server] Port ${PORT} busy — killing occupying process and retrying in 1 s…`);
    const { execSync } = require("child_process");
    try {
      if (process.platform === "win32") {
        // Commande Windows pour trouver et tuer le processus occupant le port
        execSync(
          `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /PID %a /F`,
          { shell: "cmd.exe", stdio: "ignore" }
        );
      } else {
        // Commande Linux/Mac pour libérer le port
        execSync(`fuser -k ${PORT}/tcp`, { stdio: "ignore" });
      }
    } catch { /* le processus peut déjà avoir quitté */ }
    setTimeout(() => httpServer.listen(PORT), 1000);
  } else {
    console.error("[server] Fatal error:", err);
    process.exit(1);
  }
});

// Connexion à MongoDB EN PREMIER — on n'ouvre le port HTTP qu'une fois la DB prête.
// Cela évite les erreurs "MongoNotConnectedError" sur les premières requêtes après un redémarrage.
connectDB().then(() => {
  startScheduler();       // Lance le planificateur de rappels (cron toutes les minutes)
  initSocket(httpServer); // Initialise Socket.io pour le chat communautaire en temps réel
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error("[server] MongoDB connection failed — aborting startup:", err.message);
  process.exit(1);
});
