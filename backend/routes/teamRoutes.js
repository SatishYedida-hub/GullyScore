const express = require('express');

const teamController = require('../controllers/teamController');

const router = express.Router();

router.post('/', teamController.createTeam);
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.delete('/:id', teamController.deleteTeam);
router.post('/:id/players', teamController.addPlayer);
router.delete('/:id/players/:player', teamController.removePlayer);

module.exports = router;
