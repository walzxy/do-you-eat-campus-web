const BaseRepository = require('./baseRepository');

class CafeteriaRepository extends BaseRepository {
  constructor() {
    super('cafeterias', 'cafeteria_id');
  }

  findByCampus(campus) {
    const items = this.findAll();
    return items.filter(item => item.campus === campus);
  }
}

module.exports = new CafeteriaRepository();

