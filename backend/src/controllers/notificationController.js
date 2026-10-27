const socialRepository = require('../repositories/socialRepository');
const { success } = require('../utils/response');

async function list(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 30));
    return success(res, await socialRepository.listNotifications(req.anonymousId, { page, pageSize }));
  } catch (error) { return next(error); }
}

async function markRead(req, res, next) {
  try {
    const count = await socialRepository.markNotificationRead(req.params.notificationId, req.anonymousId);
    return success(res, { updated: Boolean(count) });
  } catch (error) { return next(error); }
}

module.exports = { list, markRead };
