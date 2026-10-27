const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');
const { requireAnonymous } = require('../middleware/anonymousAuth');

router.use(requireAnonymous);
router.get('/', controller.list);
router.patch('/:notificationId/read', controller.markRead);

module.exports = router;
