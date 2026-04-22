const express = require('express');

const matchController = require('../controllers/matchController');

const router = express.Router();

router.post('/', matchController.createMatch);
router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatchById);
router.post('/:id/score', matchController.updateScore);

module.exports = router;
