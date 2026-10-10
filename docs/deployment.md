# 部署说明

## 前端部署（GitHub Pages）

前提条件：
- GitHub 仓库
- GitHub Actions 或手动构建

构建命令：
  cd frontend
  npm run build

部署到 gh-pages 分支。

注意：GitHub Pages 只能托管静态前端文件，
不能处理 Excel 上传、数据保存或 API 请求。

## 后端部署（学校服务器）

前提条件：
- Node.js 运行环境
- 公网可访问端口
- HTTPS 配置
- 持久化数据存储目录

启动命令：
  cd backend
  npm start

环境变量配置见 .env.example（项目根目录）。

待学校服务器条件确认后补充具体部署脚本。