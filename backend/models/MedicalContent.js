const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: {
    type: String,
    enum: ["article", "video"]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }
}, { timestamps: true });

module.exports = mongoose.model("MedicalContent", contentSchema);