// Entry point - connexion MongoDB, routes, démarrage serveur
const http = require("http");
const express = require("express");
const cors = require("cors");
const dns = require("node:dns/promises");
require("dotenv").config();

dns.setServers(["1.1.1.1"]);

const connectDB = require("./connectdb");
const errorHandler = require("./middleware/error.middleware");
const { initSocket } = require("./socket");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const patientRoutes = require("./routes/patient.routes");
const symptomRoutes = require("./routes/symptom.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const notificationRoutes = require("./routes/notification.routes");
const contentRoutes = require("./routes/content.routes");
const chatbotRoutes = require("./routes/chatbot.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const reminderRoutes = require("./routes/reminder.routes");
const communityRoutes = require("./routes/community.routes");

const { startScheduler } = require("./utils/scheduler");

const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());

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

app.get("/", (_req, res) => res.send("Backend is running"));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`[server] Port ${PORT} busy — killing occupying process and retrying in 1 s…`);
    const { execSync } = require("child_process");
    try {
      if (process.platform === "win32") {
        execSync(
          `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /PID %a /F`,
          { shell: "cmd.exe", stdio: "ignore" }
        );
      } else {
        execSync(`fuser -k ${PORT}/tcp`, { stdio: "ignore" });
      }
    } catch { /* process may have already exited */ }
    setTimeout(() => httpServer.listen(PORT), 1000);
  } else {
    console.error("[server] Fatal error:", err);
    process.exit(1);
  }
});

// Connect to MongoDB FIRST — only open the port once the DB is ready.
// This prevents "MongoNotConnectedError" 500s on the first requests after restart.
connectDB().then(() => {
  startScheduler();
  initSocket(httpServer);
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error("[server] MongoDB connection failed — aborting startup:", err.message);
  process.exit(1);
});
