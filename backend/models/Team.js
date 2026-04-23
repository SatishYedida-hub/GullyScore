const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    players: {
      type: [String],
      default: [],
    },
    // Optional team crest, stored as a base64 data URL. Kept small by the
    // frontend (<= ~100KB after compression). Empty string when unset.
    photo: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
