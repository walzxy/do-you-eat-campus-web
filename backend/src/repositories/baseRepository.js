const path = require('path');
const fs = require('fs');
const { config } = require('../config');
const cloudbaseStore = require('./cloudbaseStore');

function withoutDocumentId(item) {
  const copy = { ...item };
  delete copy._id;
  return copy;
}

function sameData(left, right) {
  return JSON.stringify(withoutDocumentId(left)) === JSON.stringify(withoutDocumentId(right));
}

class BaseRepository {
  constructor(collectionName, idField = 'id') {
    this.collectionName = collectionName;
    this.idField = idField;
    this.filePath = path.resolve(config.activeDataDir, collectionName + '.json');
    this.cloud = config.menuStorage === 'cloudbase';
    this.cache = null;
  }

  _ensureFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, '[]', 'utf8');
  }

  _readFile() {
    this._ensureFile();
    return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
  }

  _writeFile(data) {
    this._ensureFile();
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async ready() {
    if (!this.cloud) return;
    const rows = await cloudbaseStore.list(this.collectionName);
    this.cache = rows.length ? rows : this._readFile();
  }

  _items() {
    if (!this.cloud) return this._readFile();
    if (!this.cache) throw new Error(`主数据仓库尚未初始化: ${this.collectionName}`);
    return this.cache.map(withoutDocumentId);
  }

  findAll() {
    return this._items();
  }

  findById(id) {
    return this._items().find(item => item[this.idField] === id) || null;
  }

  async save(data) {
    if (!this.cloud) {
      this._writeFile(data);
      return;
    }

    await this.ready();
    const next = Array.isArray(data) ? data.map(withoutDocumentId) : [];
    const current = this.cache || [];
    const currentById = new Map(current.map(item => [item[this.idField], item]));
    const nextIds = new Set(next.map(item => item[this.idField]));

    for (const item of next) {
      const previous = currentById.get(item[this.idField]);
      if (previous && previous._id) {
        if (!sameData(previous, item)) await cloudbaseStore.update(this.collectionName, previous._id, item);
      } else {
        await cloudbaseStore.add(this.collectionName, item);
      }
    }

    for (const previous of current) {
      if (previous._id && !nextIds.has(previous[this.idField])) {
        await cloudbaseStore.remove(this.collectionName, previous._id);
      }
    }

    this.cache = await cloudbaseStore.list(this.collectionName);
  }
}

module.exports = BaseRepository;
