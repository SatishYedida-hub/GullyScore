const mongoose = require('mongoose');

const batsmanStatSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    out: { type: Boolean, default: false },
    howOut: { type: String, default: '' },
  },
  { _id: false }
);

const bowlerStatSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    balls: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
    runsInCurrentOver: { type: Number, default: 0 },
  },
  { _id: false }
);

const ballEventSchema = new mongoose.Schema(
  {
    label: String,
    runs: { type: Number, default: 0 },
    extra: String,
    wicket: { type: Boolean, default: false },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    teamA: { type: String },
    teamB: { type: String },
    teamAPlayers: { type: [String], default: [] },
    teamBPlayers: { type: [String], default: [] },

    overs: { type: Number },
    battingTeam: { type: String, enum: ['teamA', 'teamB'], default: 'teamA' },

    status: {
      type: String,
      enum: ['setup', 'live', 'completed'],
      default: 'setup',
    },

    score: {
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
    },

    extras: {
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
    },

    batsmen: { type: [batsmanStatSchema], default: [] },
    bowlers: { type: [bowlerStatSchema], default: [] },

    striker: { type: String, default: null },
    nonStriker: { type: String, default: null },
    currentBowler: { type: String, default: null },
    lastOverBowler: { type: String, default: null },

    currentOverEvents: { type: [ballEventSchema], default: [] },

    result: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
