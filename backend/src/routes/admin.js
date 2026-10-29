const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/adminAuth');
const multer = require('multer');

// multer 用于处理 Excel 文件上传
const upload = multer({ storage: multer.memoryStorage() });
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

// ---- 认证（无需 Token） ----
router.post('/login', adminController.login);
router.get('/verify', adminController.verify);

// ---- 以下需要认证 Token ----
router.use(authMiddleware);

// 菜品管理
router.get('/dishes', asyncHandler(adminController.listDishes));
router.get('/dishes/:dishId', asyncHandler(adminController.getDish));
router.put('/dishes/:dishId', asyncHandler(adminController.updateDish));
router.post('/dishes', asyncHandler(adminController.createDish));
router.post('/dishes/:dishId/copy', asyncHandler(adminController.copyDish));
router.patch('/dishes/:dishId/status', asyncHandler(adminController.toggleDishStatus));

// 反馈管理
router.get('/feedbacks', asyncHandler(adminController.listFeedbacks));
router.patch('/feedbacks/:feedbackId/status', asyncHandler(adminController.updateFeedbackStatus));

// Excel 导入
router.post('/import/preview', upload.single('file'), adminController.importPreview);
router.post('/import/confirm', asyncHandler(adminController.importConfirm));

// 版本管理
router.get('/versions', adminController.getVersions);
router.post('/versions/rollback', adminController.rollbackVersion);

// 变更日志
router.get('/changelog', adminController.getChangeLog);

// 辅助接口（下拉选择等）
router.get('/cafeterias', asyncHandler(adminController.listCafeterias));
router.get('/cafeterias/:cafeteriaId/windows', asyncHandler(adminController.listWindowsByCafeteria));
router.get('/status-options', adminController.getStatusOptions);

module.exports = router;
