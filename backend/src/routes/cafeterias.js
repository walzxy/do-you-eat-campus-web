const express = require('express');
const router = express.Router();
const cafeteriaController = require('../controllers/cafeteriaController');

// GET /api/cafeterias — 食堂列表（支持 ?campus= 筛选）
router.get('/', cafeteriaController.listCafeterias);

// GET /api/cafeterias/:cafeteriaId — 食堂详情
router.get('/:cafeteriaId', cafeteriaController.getCafeteriaById);

module.exports = router;