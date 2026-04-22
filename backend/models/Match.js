const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    teamA: { type: String },
    teamB: { type: String },
    overs: { type: Number },
    score: {
      type: scoreSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['live', 'completed'],
      default: 'live',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
