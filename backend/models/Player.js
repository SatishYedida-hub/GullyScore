const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    // Optional profile photo, stored as a base64 data URL. The frontend
    // compresses to <= ~100KB before upload.
    photo: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Player', playerSchema);
