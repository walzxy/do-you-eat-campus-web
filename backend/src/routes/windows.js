const express = require('express');
const router = express.Router();
const windowController = require('../controllers/windowController');

// GET /api/windows/:windowId — 窗口详情
router.get('/:windowId', windowController.getWindowById);

module.exports = router;