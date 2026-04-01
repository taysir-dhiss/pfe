// Entry point - connexion MongoDB, routes, démarrage serveur
const express = require("express");
const cors = require("cors");
const dns = require("node:dns/promises");
require("dotenv").config();

dns.setServers(["1.1.1.1"]);

const connectDB = require("./connectdb");
const errorHandler = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const patientRoutes = require("./routes/patient.routes");
const symptomRoutes = require("./routes/symptom.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const notificationRoutes = require("./routes/notification.routes");
const contentRoutes = require("./routes/content.routes");
const chatbotRoutes = require("./routes/chatbot.routes");
const recommendationRoutes = require("./routes/recommendation.routes");

const app = express();

connectDB();

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

app.get("/", (_req, res) => res.send("Backend is running"));

// Global error handler (doit être en dernier)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
