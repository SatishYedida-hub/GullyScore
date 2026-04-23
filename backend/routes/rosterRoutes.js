const express = require('express');

const rosterController = require('../controllers/rosterController');
const { requireAdmin } = require('../utils/admin');

const router = express.Router();

router.get('/', rosterController.listPlayers);
router.post('/', rosterController.createPlayer);
router.delete('/:id', requireAdmin, rosterController.deletePlayer);
router.put('/:id/photo', rosterController.updatePhoto);

module.exports = router;
