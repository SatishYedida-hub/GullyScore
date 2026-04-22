const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    name: { type: String },
    team: { type: String },
    role: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Player', playerSchema);
