const express = require('express');

const matchRoutes = require('./matchRoutes');
const playerRoutes = require('./playerRoutes');
const teamRoutes = require('./teamRoutes');

const router = express.Router();

router.use('/teams', teamRoutes);
router.use('/matches', matchRoutes);
router.use('/players', playerRoutes);

module.exports = router;
