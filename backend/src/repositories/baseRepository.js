// 数据存储基础抽象接口
// 当前使用本地 JSON 文件存储，后续可替换为数据库实现

const path = require('path');
const fs = require('fs');
const { config } = require('../config');

class BaseRepository {
  constructor(collectionName, idField = 'id') {
    this.collectionName = collectionName;
    this.idField = idField;
    this.filePath = path.resolve(config.activeDataDir, collectionName + '.json');
  }

  _ensureFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]', 'utf8');
    }
  }

  _readAll() {
    this._ensureFile();
    const raw = fs.readFileSync(this.filePath, 'utf8');
    return JSON.parse(raw);
  }

  _writeAll(data) {
    this._ensureFile();
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  findAll() {
    return this._readAll();
  }

  findById(id) {
    const items = this._readAll();
    return items.find(item => item[this.idField] === id) || null;
  }

  save(data) {
    this._writeAll(data);
  }
}

module.exports = BaseRepository;

