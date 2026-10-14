const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const healthRoute = require('./routes/health');
const cafeteriasRoute = require('./routes/cafeterias');
const windowsRoute = require('./routes/windows');
const dishesRoute = require('./routes/dishes');
const feedbackRoute = require('./routes/feedback');
const windowController = require('./controllers/windowController');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(requestLogger);

app.use('/api', healthRoute);
app.use('/api/cafeterias', cafeteriasRoute);
app.use('/api/windows', windowsRoute);
app.use('/api/dishes', dishesRoute);

// 反馈提交接口
app.use('/api/feedback', feedbackRoute);

// 食堂下的窗口列表（在 cafeterias 路由之外单独注册，保持路由隔离）
app.get('/api/cafeterias/:cafeteriaId/windows', windowController.listWindowsByCafeteria);

// 窗口下的菜品列表
app.get('/api/windows/:windowId/dishes', require('./controllers/dishController').listDishesByWindow);

// 管理端路由（需要认证 Token）
app.use('/api/admin', adminRoutes);

// 404 兜底 - 未匹配路由
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: '接口不存在: ' + req.method + ' ' + req.originalUrl }
  });
});

app.use(errorHandler);

module.exports = app;

