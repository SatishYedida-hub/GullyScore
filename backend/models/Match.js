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

const inningsSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    battingTeam: { type: String, enum: ['teamA', 'teamB'], required: true },
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
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    teamA: { type: String },
    teamB: { type: String },
    teamAPlayers: { type: [String], default: [] },
    teamBPlayers: { type: [String], default: [] },
    // Team crests snapshotted at match-creation time so the scorecard keeps
    // the right logos even if a team is later renamed or deleted.
    teamAPhoto: { type: String, default: '' },
    teamBPhoto: { type: String, default: '' },

    overs: { type: Number },
    battingTeam: { type: String, enum: ['teamA', 'teamB'], default: 'teamA' },

    status: {
      type: String,
      enum: ['setup', 'live', 'innings-break', 'completed'],
      default: 'setup',
    },

    innings: { type: [inningsSchema], default: [] },
    target: { type: Number, default: null },
    result: { type: String, default: '' },

    // Shared secret that authorizes write operations (scoring, setup, undo,
    // delete, transfer). Hidden from default queries; only read when
    // explicitly selected.
    scorerToken: { type: String, default: '', select: false },

    history: {
      type: [
        {
          _id: false,
          kind: { type: String },
          snapshot: { type: mongoose.Schema.Types.Mixed },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
