// 反馈控制器 — 用户提交反馈
const feedbackRepository = require('../repositories/feedbackRepository');
const cafeteriaRepository = require('../repositories/cafeteriaRepository');
const windowRepository = require('../repositories/windowRepository');
const dishRepository = require('../repositories/dishRepository');
const { success, fail } = require('../utils/response');

const VALID_ISSUE_TYPES = ['菜品不存在', '价格不符', '窗口信息错误', '供应状态错误', '其他'];
const MAX_DESCRIPTION_LENGTH = 500;

// POST /api/feedback
function submitFeedback(req, res) {
  const { issue_type, description, cafeteria_id, window_id, dish_id } = req.body;

  // 必填校验
  if (!issue_type) {
    return fail(res, '问题类型不能为空', 400);
  }
  if (!VALID_ISSUE_TYPES.includes(issue_type)) {
    return fail(res, '非法问题类型，仅支持：' + VALID_ISSUE_TYPES.join('、'), 400);
  }
  if (description === undefined || description === null) {
    return fail(res, '补充说明不能为空', 400);
  }
  if (typeof description !== 'string' || description.trim() === '') {
    return fail(res, '补充说明不能为空', 400);
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return fail(res, '补充说明不能超过 ' + MAX_DESCRIPTION_LENGTH + ' 个字符', 400);
  }

  // 关联编号校验（如果传入）
  let cafeteriaExists = false;
  let windowExists = false;
  let dishExists = false;

  if (cafeteria_id) {
    cafeteriaExists = !!cafeteriaRepository.findById(cafeteria_id);
    if (!cafeteriaExists) {
      return fail(res, '食堂不存在: ' + cafeteria_id, 400);
    }
  }
  if (window_id) {
    windowExists = !!windowRepository.findById(window_id);
    if (!windowExists) {
      return fail(res, '窗口不存在: ' + window_id, 400);
    }
  }
  if (dish_id) {
    dishExists = !!dishRepository.findById(dish_id);
    if (!dishExists) {
      return fail(res, '菜品不存在: ' + dish_id, 400);
    }
  }

  // 关联关系校验
  // 如果同时传了 cafeteria_id 和 window_id，window 必须属于该 cafeteria
  if (cafeteria_id && window_id) {
    const window = windowRepository.findById(window_id);
    if (window && window.cafeteria_id !== cafeteria_id) {
      return fail(res, '窗口 ' + window_id + ' 不属于食堂 ' + cafeteria_id, 400);
    }
  }

  // 如果同时传了 window_id 和 dish_id，dish 必须属于该 window
  if (window_id && dish_id) {
    const dish = dishRepository.findById(dish_id);
    if (dish && dish.window_id !== window_id) {
      return fail(res, '菜品 ' + dish_id + ' 不属于窗口 ' + window_id, 400);
    }
  }

  // 如果同时传了 cafeteria_id 和 dish_id，dish 必须属于该 cafeteria
  if (cafeteria_id && dish_id) {
    const dish = dishRepository.findById(dish_id);
    if (dish && dish.cafeteria_id !== cafeteria_id) {
      return fail(res, '菜品 ' + dish_id + ' 不属于食堂 ' + cafeteria_id, 400);
    }
  }

  // 保存反馈
  const feedback = feedbackRepository.save({
    issue_type,
    description: description.trim(),
    cafeteria_id: cafeteria_id || null,
    window_id: window_id || null,
    dish_id: dish_id || null,
  });

  return success(res, {
    feedback_id: feedback.feedback_id,
    status: feedback.status,
    created_at: feedback.created_at,
  }, 201);
}

module.exports = { submitFeedback };