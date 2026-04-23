const express = require('express');

const { isAdminConfigured, isAdminRequest } = require('../utils/admin');

const router = express.Router();

// Whether admin protection is enabled on the server, and whether the
// current caller is recognised as admin. The client uses this to decide
// whether to show destructive buttons.
router.get('/status', (req, res) => {
  return res.status(200).json({
    configured: isAdminConfigured(),
    isAdmin: isAdminRequest(req),
  });
});

// Validate a submitted token. Client sends the candidate in the
// `X-Admin-Token` header (via the shared axios helper) and gets a clean
// yes/no, so the login modal can give immediate feedback.
router.post('/verify', (req, res) => {
  if (!isAdminConfigured()) {
    return res.status(200).json({
      configured: false,
      isAdmin: true,
      message:
        'Admin protection is not configured on the server. All destructive actions are currently open.',
    });
  }
  if (!isAdminRequest(req)) {
    return res
      .status(401)
      .json({ configured: true, isAdmin: false, message: 'Invalid admin key' });
  }
  return res.status(200).json({
    configured: true,
    isAdmin: true,
    message: 'Admin unlocked',
  });
});

module.exports = router;
