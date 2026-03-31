const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

//database
const connectDB= require("./connectdb");
connectDB();


// Middlewares
app.use(cors());
app.use(express.json());

// Routes
//const authRoutes = require("./routes/auth.routes");
//const adminRoutes = require("./routes/admin.routes");

//app.use("/api/auth", authRoutes);
//app.use("/api/admin", adminRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Backend is running ");
nm});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
