const express = require('express');

const rosterController = require('../controllers/rosterController');

const router = express.Router();

router.get('/', rosterController.listPlayers);
router.post('/', rosterController.createPlayer);
router.delete('/:id', rosterController.deletePlayer);

module.exports = router;
