# 部署说明

## 前端部署（GitHub Pages）

前提条件：
- GitHub 仓库
- GitHub Actions 或手动构建

学生端 H5 构建命令：

```bash
cd student-app
npm ci
npm run build:h5
```

构建产物位于 `student-app/dist/build/h5/`。

仓库中的 `.github/workflows/deploy-student-app.yml` 会在 `main` 分支更新学生端后，自动构建并发布到 `gh-pages` 分支。GitHub Pages 的发布源需要设置为 `gh-pages` 分支的根目录 `/`。

旧的 `frontend/` 是历史 Vue/Vite 管理端页面，不再作为学生端临时域名的发布入口。

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
