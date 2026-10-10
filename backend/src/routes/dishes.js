const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');

// GET /api/dishes/search?keyword= — 关键词搜索
router.get('/search', dishController.searchDishes);

// GET /api/dishes/:dishId — 菜品详情
router.get('/:dishId', dishController.getDishById);

module.exports = router;