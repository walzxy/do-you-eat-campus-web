const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/adminAuth');
const multer = require('multer');

// multer 用于处理 Excel 文件上传
const upload = multer({ storage: multer.memoryStorage() });

// ---- 认证（无需 Token） ----
router.post('/login', adminController.login);
router.get('/verify', adminController.verify);

// ---- 以下需要认证 Token ----
router.use(authMiddleware);

// 菜品管理
router.get('/dishes', adminController.listDishes);
router.get('/dishes/:dishId', adminController.getDish);
router.put('/dishes/:dishId', adminController.updateDish);
router.post('/dishes', adminController.createDish);
router.post('/dishes/:dishId/copy', adminController.copyDish);
router.patch('/dishes/:dishId/status', adminController.toggleDishStatus);

// 反馈管理
router.get('/feedbacks', adminController.listFeedbacks);
router.patch('/feedbacks/:feedbackId/status', adminController.updateFeedbackStatus);

// Excel 导入
router.post('/import/preview', upload.single('file'), adminController.importPreview);
router.post('/import/confirm', adminController.importConfirm);

// 版本管理
router.get('/versions', adminController.getVersions);
router.post('/versions/rollback', adminController.rollbackVersion);

// 变更日志
router.get('/changelog', adminController.getChangeLog);

// 辅助接口（下拉选择等）
router.get('/cafeterias', adminController.listCafeterias);
router.get('/cafeterias/:cafeteriaId/windows', adminController.listWindowsByCafeteria);
router.get('/status-options', adminController.getStatusOptions);

module.exports = router;