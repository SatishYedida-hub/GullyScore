const express = require('express');

const matchController = require('../controllers/matchController');
const { requireAdmin } = require('../utils/admin');

const router = express.Router();

router.post('/', matchController.createMatch);
router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatchById);
router.delete('/:id', requireAdmin, matchController.deleteMatch);
router.post('/:id/setup', matchController.setupMatch);
router.post('/:id/setup-innings2', matchController.setupInnings2);
router.post('/:id/score', matchController.updateScore);
router.post('/:id/new-batsman', matchController.newBatsman);
router.post('/:id/new-bowler', matchController.newBowler);
router.post('/:id/undo', matchController.undoLastAction);
router.post('/:id/declare', matchController.declareInnings);
router.post('/:id/draw', matchController.endAsDraw);
router.post('/:id/transfer-scorer', matchController.transferScorer);

module.exports = router;
