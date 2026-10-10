# 今天吃了么

上海财经大学食堂信息检索+辅助决策系统。

## 项目结构

```
frontend/  - Vue 3 + Vite 前端（学生端）
backend/   - Node.js + Express 后端 API
shared/    - 前后端共享的数据定义
data/      - Excel 源文件和结构化数据
docs/      - 架构、接口和部署文档
tests/     - 测试
```

## 本地启动

### 后端

```
cd backend
npm install
npm start
```

后端默认运行在 http://localhost:3001。
健康检查接口：http://localhost:3001/api/health

### 前端

```
cd frontend
npm install
npm run dev
```

前端默认运行在 http://localhost:5173。

### 测试

```
cd backend
npm test            # 运行后端 Vitest 测试（当前 27 个）

cd frontend
npm test            # 占位命令，当前阶段暂不编写页面测试
```

## 环境变量

复制 .env.example 为 backend/.env 配置文件。
或直接修改 backend/.env 中的值。

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 后端端口 | 3001 |
| NODE_ENV | 运行环境 | development |
| CORS_ORIGIN | 允许的前端来源 | http://localhost:5173 |
| DATA_DIR | 数据目录 | ../data |
| LOG_LEVEL | 日志级别 | info |
| VITE_API_BASE_URL | 前端使用的后端 API 地址 | http://localhost:3001 |

## 禁止提交的内容

- 真实 API 密钥和密码
- 服务器地址和 Token
- 个人信息
- 真实 Excel 数据文件
- node_modules/ 和构建产物

## 当前阶段

地基搭建阶段（T1-T13）：搭建项目骨架、数据导入能力和 API 约定。
不包含产品页面、UI 设计、AI、登录和纠错功能。
