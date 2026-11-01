const socialRepository = require('../repositories/socialRepository');
const { success } = require('../utils/response');

async function list(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 30));
    const result = await socialRepository.listNotifications(req.anonymousId, { page, pageSize });
    const actors = new Map();
    result.data = await Promise.all(result.data.map(async item => {
      if (!item.actor_id) return { ...item, actor_name: '已注销用户', actor_short_id: '' };
      if (!actors.has(item.actor_id)) actors.set(item.actor_id, socialRepository.getAccount(item.actor_id));
      const account = await actors.get(item.actor_id);
      return {
        ...item,
        actor_name: account && account.status !== 'deleted' ? account.display_name : '已注销用户',
        actor_short_id: account && account.status !== 'deleted' ? item.actor_id.slice(-6) : '',
      };
    }));
    return success(res, result);
  } catch (error) { return next(error); }
}

async function markRead(req, res, next) {
  try {
    const count = await socialRepository.markNotificationRead(req.params.notificationId, req.anonymousId);
    return success(res, { updated: Boolean(count) });
  } catch (error) { return next(error); }
}

module.exports = { list, markRead };
