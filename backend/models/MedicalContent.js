// MedicalContent model - articles and videos added by admin (Video/Article subtypes)
const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Le titre est obligatoire"],
      trim: true
    },
    contenu: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ["article", "video"],
      required: [true, "Le type est obligatoire"]
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalContent", contentSchema);
