const express = require('express');
const router = express.Router();
const controller = require('../controllers/accountController');
const { requireAnonymous } = require('../middleware/anonymousAuth');

router.post('/session', controller.createSession);
router.use(requireAnonymous);
router.get('/me', controller.getMe);
router.patch('/me', controller.updateMe);
router.put('/taste', controller.updateTaste);
router.get('/history', controller.listHistory);
router.post('/history', controller.addHistory);
router.delete('/history/:historyId', controller.deleteHistory);
router.delete('/', controller.deleteAccount);

module.exports = router;
