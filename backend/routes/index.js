const express = require('express');

const adminRoutes = require('./adminRoutes');
const matchRoutes = require('./matchRoutes');
const playerRoutes = require('./playerRoutes');
const rosterRoutes = require('./rosterRoutes');
const teamRoutes = require('./teamRoutes');

const router = express.Router();

router.use('/admin', adminRoutes);
router.use('/teams', teamRoutes);
router.use('/matches', matchRoutes);
router.use('/players', playerRoutes);
router.use('/roster', rosterRoutes);

module.exports = router;
