// Connexion à la base de données MongoDB via Mongoose
// Utilise l'URI définie dans la variable d'environnement MONGO_URI
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // family: 4 force l'utilisation d'IPv4 pour la connexion (évite les problèmes IPv6)
        await mongoose.connect(process.env.MONGO_URI, { family: 4 });
        console.log("MongoDB connected");
    } catch (error) {
        // En cas d'échec de connexion, on arrête le serveur pour éviter un démarrage dans un état invalide
        console.log("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;