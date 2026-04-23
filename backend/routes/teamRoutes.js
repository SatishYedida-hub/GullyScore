const express = require('express');

const teamController = require('../controllers/teamController');
const { requireAdmin } = require('../utils/admin');

const router = express.Router();

router.post('/', teamController.createTeam);
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.delete('/:id', requireAdmin, teamController.deleteTeam);
router.post('/:id/players', teamController.addPlayer);
router.delete(
  '/:id/players/:player',
  requireAdmin,
  teamController.removePlayer
);
router.put('/:id/photo', teamController.updatePhoto);

module.exports = router;
