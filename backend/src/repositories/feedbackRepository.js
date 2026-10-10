const BaseRepository = require('./baseRepository');
const path = require('path');
const fs = require('fs');

const FEEDBACK_DIR = path.resolve(__dirname, '..', '..', '..', 'data', 'feedback');
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, 'feedback.json');

class FeedbackRepository {
  _ensureFile() {
    if (!fs.existsSync(FEEDBACK_DIR)) {
      fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
    }
    if (!fs.existsSync(FEEDBACK_FILE)) {
      fs.writeFileSync(FEEDBACK_FILE, '[]', 'utf8');
    }
  }

  _readAll() {
    this._ensureFile();
    const raw = fs.readFileSync(FEEDBACK_FILE, 'utf8');
    return JSON.parse(raw);
  }

  _writeAll(data) {
    this._ensureFile();
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  findAll() {
    return this._readAll();
  }

  findById(id) {
    const items = this._readAll();
    return items.find(item => item.feedback_id === id) || null;
  }

  /**
   * 保存一条新反馈
   * @param {Object} feedbackData
   * @returns {Object} 保存后的完整反馈对象（含 feedback_id、status、created_at）
   */
  save(feedbackData) {
    const items = this._readAll();
    // 生成 feedback_id: FB 后接 3 位序号
    const nextSeq = items.length + 1;
    const feedbackId = 'FB' + String(nextSeq).padStart(3, '0');

    const feedback = {
      feedback_id: feedbackId,
      issue_type: feedbackData.issue_type,
      description: feedbackData.description,
      cafeteria_id: feedbackData.cafeteria_id || null,
      window_id: feedbackData.window_id || null,
      dish_id: feedbackData.dish_id || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    items.push(feedback);
    this._writeAll(items);
    return feedback;
  }
}

module.exports = new FeedbackRepository();