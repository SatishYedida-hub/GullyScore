const express = require('express');

const matchController = require('../controllers/matchController');

const router = express.Router();

router.post('/', matchController.createMatch);
router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatchById);
router.post('/:id/setup', matchController.setupMatch);
router.post('/:id/score', matchController.updateScore);
router.post('/:id/new-batsman', matchController.newBatsman);
router.post('/:id/new-bowler', matchController.newBowler);

module.exports = router;
