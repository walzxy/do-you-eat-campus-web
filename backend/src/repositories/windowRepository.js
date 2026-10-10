const BaseRepository = require('./baseRepository');

class WindowRepository extends BaseRepository {
  constructor() {
    super('windows', 'window_id');
  }

  findByCafeteriaId(cafeteriaId) {
    const items = this.findAll();
    return items.filter(item => item.cafeteria_id === cafeteriaId);
  }
}

module.exports = new WindowRepository();

