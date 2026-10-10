# 地基交接说明

## 快速启动

```bash
# 后端
cd backend
npm install
npm start         # 启动服务 http://localhost:3001

# 前端
cd frontend
npm install
npm run dev       # 启动开发服务器 http://localhost:5173

# 前端构建（产物输出到 frontend/dist/）
npm run build

# 后端测试
cd backend
npm test          # 运行全部 Vitest 测试
```

健康检查：`GET http://localhost:3001/api/health`

---

## 目录和文件职责

| 目录 | 职责 |
|------|------|
| `frontend/` | Vue 3 + Vite 前端工程。包含全部 11 个页面（主页、轮盘抽取、推荐、详情、搜索、食堂列表、窗口列表、窗口菜品、必吃榜、反馈、404），构建通过。 |
| `backend/` | Node.js + Express 后端 API 服务。包含路由、中间件、数据校验、仓储抽象。 |
| `shared/` | 前后端共同引用的数据字段定义。 |
| `data/` | Excel 源文件（import/）、处理后数据（processed/）、构造示例数据（sample/）、拒绝记录（rejected/）。开发期从 `sample/` 读取构造数据，生产环境使用 `processed/`。 |
| `docs/` | 架构说明、数据模型、API 接口约定、部署说明、决策记录、交接说明。 |
| `tests/` | 跨模块公共测试占位。后端单元测试在 `backend/src/__tests__/` 下。 |

---

## 已实现内容

| 模块 | 内容 | 验证方式 |
|------|------|----------|
| 后端配置 | 5 个环境变量（PORT、NODE_ENV、CORS_ORIGIN、DATA_DIR、LOG_LEVEL），从 `.env` 读取；`activeDataDir` 根据 NODE_ENV 自动选择 sample/（dev）或 processed/（prod） | `npm start` 后查看控制台 |
| 健康检查 | `GET /api/health` 返回 `{ success: true, data: { status: "ok" } }` | curl http://localhost:3001/api/health |
| 统一响应格式 | `utils/response.js` — success() 和 fail() 函数 | 见 `response.test.js` |
| 统一错误处理 | `middleware/errorHandler.js` — 开发环境返回详情，生产环境只返回通用信息 | 见 `404.test.js` |
| 404 兜底 | 未匹配路由返回 JSON 格式错误 | 见 `404.test.js` |
| 请求日志 | `middleware/requestLogger.js` — 记录方法、路径、状态码、耗时 | |
| CORS 跨域 | 根据 `CORS_ORIGIN` 配置允许的前端来源 | |
| 数据仓储抽象 | `BaseRepository` + 食堂/窗口/菜品三个具体仓储 | 见 `repositories/` |
| 菜品校验规则 | `schemas/dishSchema.js` — 必填字段、价格、供应状态、分类校验 | 见 `dishSchema.test.js`（22 个测试） |
| Excel 导入服务 | `services/excelImportService.js` — 完整实现：读取三张工作表（食堂表/窗口表/菜品数据），校验编号格式、编号唯一性、跨表关系、价格规则、供应状态、分类必填，级联拒绝孤儿行，原子替换目标目录，生成导入报告 | 见 `excelImport.test.js`（13 个测试） |
| 只读查询接口 | 8 个接口：食堂列表、食堂详情、食堂窗口列表、窗口详情、窗口菜品列表、菜品详情、菜品搜索（含组合筛选）、食堂校区筛选 | 见下方"已实现接口" |
| 菜品组合筛选 | `GET /api/dishes/search` 支持 keyword、category_major、category_minor、budget、flavor、is_packable 参数，AND 关系组合 | 见 routes.test.js 组合筛选测试 |
| 反馈提交接口 | `POST /api/feedback` 用户反馈提交 | 见 feedback.test.js |
| Vitest 测试 | 8 个测试文件，94 个测试用例 | `npm test` |
| 前端工程 | Vue 3 + Vite 工程搭建完成，构建通过 | `npm run build` |
| 前端测试命令 | 占位命令，仅表示当前阶段暂不编写页面测试。它会正常退出，但不代表页面已通过自动化测试 | `cd frontend; npm test` |

### 已实现接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/cafeterias` | 食堂列表（支持 `?campus=` 筛选） |
| GET | `/api/cafeterias/:cafeteriaId` | 食堂详情（含窗口列表） |
| GET | `/api/cafeterias/:cafeteriaId/windows` | 食堂窗口列表 |
| GET | `/api/windows/:windowId` | 窗口详情（含菜品列表） |
| GET | `/api/windows/:windowId/dishes` | 窗口菜品列表 |
| GET | `/api/dishes/:dishId` | 菜品详情 |
| GET | `/api/dishes/search` | 关键词搜索 + 组合筛选（keyword、category_major、category_minor、budget、flavor、is_packable） |
| POST | `/api/feedback` | 提交用户反馈 |

---

## 占位内容（非完整功能）

| 路径 | 状态说明 |
|------|----------|
| `frontend/src/App.vue` | `<router-view>` 入口，渲染全部 11 个路由页面 |
| `frontend/src/views/` | 11 个视图页面：主页、轮盘抽取、推荐、详情、搜索、食堂列表、窗口列表、窗口菜品、必吃榜、反馈、404 |
| `frontend/src/components/` | 7 个可复用组件：PageHeader、DishCard、DishList、DishFilters、LoadingState、ErrorState、EmptyState |
| `frontend/src/router/index.js` | 注册 11 条路由（Home、Wheel、Recommend、DishDetail、Search、Cafeterias、CafeteriaWindows、WindowDishes、MustEat、Feedback、NotFound），ROUTER_READY = true |
| `backend/src/services/excelImportService.js` | 已完成 Excel v3 三表全量导入：校验、级联拒绝、原子替换、报告输出 |
| `backend/src/schemas/dishSchema.js` | 只实现了基础字段校验，跨表关联校验未实现 |
| `backend/src/controllers/` | 已实现食堂/窗口/菜品三个只读查询控制器 |
| `backend/src/app/` | 空目录，待业务模块确定后填充 |
| `tests/` | 空目录（含 `.gitkeep`） |
| `data/processed/` | 空目录（仅含 `.gitkeep`），等待正式数据处理脚本填充 |
| `data/sample/` | 72 道菜品的构造数据（可被 Git 跟踪），开发期通过仓储自动读取 |
| `data/rejected/` | 空目录（仅含 `.gitkeep`），等待导入失败时存放拒绝记录 |
| `data/import/` | 空目录（仅含 `.gitkeep`），等待放置 Excel 源文件 |

---

## 等待产品确认的内容

| 内容 | 阻塞什么 |
|------|----------|
| 产品功能设计文件（PPT / Figma / 文档） | 前端全部页面开发、路由注册、交互逻辑 |
| UI 风格（简洁、活泼、数据面板） | 组件样式、配色、布局 |
| 5 个食堂的正式名称 | 示例数据准备和后端数据初始化 |
| Excel 最终字段和填写规则 | 完整导入校验、字段映射 |
| 供应时段精确度（是否需要 HH:MM） | 菜品数据模型 |

## 等待服务器确认的内容

| 内容 | 阻塞什么 |
|------|----------|
| 学校服务器是否提供公网访问 | 后端部署方案 |
| 学校服务器是否安装 Node.js | 后端运行环境 |
| 学校服务器是否支持 HTTPS | API 调用安全 |
| 允许使用的端口 | 后端端口配置 |

## 当前明确不做的功能（地基阶段）

- 学生端页面（搜索、筛选、推荐、浏览）
- 用户登录和注册
- 管理员上传页面
- AI 推荐
- 管理员反馈查询、审核和删除
- 菜品图片
- 实时售罄
- 大小份 / 多规格价格
- 活动价格
- 用户评分和评价
- 数据库（保持 JSON / SQLite 可替换）
- 正式部署脚本

---

## 文档修改清单（R3 轮次）

| 文件 | 修改内容 |
|------|----------|
| `.gitignore` | 新增 `data/sample/` 规则，允许 JSON 文件被 Git 跟踪（实现 Git 交接）；后续清理重复规则 |
| `shared/data-dictionary.md` | `category_major` 字段从"否"(可选)改为"是"(必填) |
| `backend/src/schemas/dishSchema.js` | 增加缺少 `category_major` 大类的校验，报错"缺少大类" |
| `backend/src/__tests__/dishSchema.test.js` | 增加"缺少大类应失败"测试；所有正确数据测试行增加 `category_major` 必填字段 |
| `backend/src/config/index.js` | 新增 `activeDataDir` 配置，根据 `NODE_ENV` 自动选择 `sample/`(开发) 或 `processed/`(生产)，支持 `DATA_SOURCE` 覆盖 |
| `backend/src/__tests__/config.test.js` | 新增配置测试：开发默认 sample、生产默认 processed、DATA_SOURCE 可覆盖 |
| `backend/src/repositories/baseRepository.js` | 构造方法支持第二个参数 `idField`（默认 `'id'`），`findById` 使用 `item[this.idField]` |
| `backend/src/repositories/cafeteriaRepository.js` | 传入 `cafeteria_id` 作为 id 字段名 |
| `backend/src/repositories/windowRepository.js` | 传入 `window_id` 作为 id 字段名 |
| `backend/src/repositories/dishRepository.js` | 传入 `dish_id` 作为 id 字段名 |
| `data/sample/*.json` | 从 `data/processed/` 迁移构造数据到 `data/sample/`（共 3 个文件） |
| `data/processed/*.json` | 已清空（保留 `.gitkeep`），构造数据不再与 processed 耦合 |
| `data/processed/dishes.json` | 关键词分隔符由英文逗号统一为中文顿号 |
| `docs/excel-import.md` | 修正目录描述：`sample/` 为构造 JSON 数据，`import/` 为 Excel 源文件，`processed/` 为转换后数据 |

## 文档修改清单（T10-T11 收尾）

| 文件 | 修改内容 |
|------|----------|
| `docs/api-contract.md` | 补齐 T10 组合筛选参数、预算规则、校验规则，以及 T11 反馈提交接口约定 |
| `docs/handover.md` | 同步 T10/T11 的完成状态，明确反馈接口边界和测试数量 |

## 文档修改清单（T12-T20 前端页面开发收尾）

| 文件 | 修改内容 |
|------|----------|
| `docs/handover.md` | 更新目录描述、占位内容说明、声明区块，同步 T12-T20 完成状态 |

## 文档修改清单（R2 轮次）
|------|----------|
| `.gitignore` | 重写，确保所有敏感文件被忽略（.env、data/*、构建产物）, 同时确保 .gitkeep 不被忽略 |
| `.env.example` | 保持不变 |
| `frontend/package.json` | 添加 vue 依赖、dev/build/preview/test 脚本 |
| `frontend/index.html` | 修复 PowerShell 转义导致的乱码和 `,n` 后缀 |
| `frontend/src/App.vue` | 修复乱码，恢复正确 Vue SFC 格式 |
| `frontend/src/services/api.js` | 修复模板字符串缺少反引号的语法错误 |
| `frontend/src/styles/main.css` | 修复中文乱码 |
| `backend/vitest.config.js` | 新增 |
| `docs/project-structure.md` | 与实际目录一致（增加 `__tests__`、`vitest.config.js`、`.gitkeep` 等） |
| `docs/deployment.md` | 修正 `backend/.env.example` 为 `.env.example`（根目录） |
| `shared/data-dictionary.md` | 删除第 73-102 行的重复内容 |

## 仍存在的问题

| 问题 | 说明 |
|------|------|
| 1. 学校服务器条件未确认 | 后端部署方案、端口、HTTPS、Node.js 版本均未知 |
| 2. Excel 最终字段和规则未确认 | 当前 `dishSchema.js` 基于 v2 示例，可能需调整 |
| 3. 产品功能设计文件未提供 | 无法进入页面和 UI 开发 |
| 4. 前端测试命令为占位命令 | `npm test` 正常退出但不代表页面已完成自动化测试。待 UI 开发后补充真实测试 |

## 已解决问题（本轮）

| 问题 | 解决方案 |
|------|----------|
| 构造数据从 processed 隔离 | 迁移到 `data/sample/`，`BaseRepository` 通过 `config.activeDataDir` 读取 |
| 构造数据可被 Git 跟踪 | 修改 `.gitignore`，`data/sample/*.json` 可被提交 |
| 关键词分隔符统一 | 统一使用中文顿号 `、`，数据字典已在 T7 确认 |
| `BaseRepository.findById` 使用具体编号字段 | 构造方法增加 `idField` 参数，各仓储传入 `cafeteria_id`/`window_id`/`dish_id` |
| `category_major` 改为必填 | 数据字典、校验逻辑、测试均更新 |
| 数据字段歧义 | 数据字典中 `category_major` 明确为必填 |

---

## 安全检查结果

本表区分三件事：
1. **文件是否被 Git 忽略** — 是否受 `.gitignore` 保护，不会默认提交。
2. **内容是否经过人工审查** — 是否有人逐行检查过文件内容。
3. **是否允许进入公开仓库** — 综合结论。

| 检查项 | 文件是否被 Git 忽略 | 内容审查情况 | 公开仓库结论 |
|--------|-------------------|-------------|-------------|
| `.env` 文件（后端配置） | ✅ `backend/.env` 被忽略 | ✅ 仅含端口和路径，无密钥密码 | ✅ 不含敏感数据 |
| 服务器密码/Token/私钥 | — | ✅ 不存在任何密钥文件 | ✅ 不存在 |
| `.venv` / `node_modules` | ✅ 均已忽略 | — | ✅ 不会提交 |
| 根目录 Excel 文件 | ✅ 被 `/*.xlsx` 忽略 | ❌ 尚未完成内容审查，需由数据板块负责人确认 | ❌ 未经确认前不得提交 |
| 日志文件 | ✅ `logs/` 和 `*.log` 被忽略 | ✅ 日志中间件不记录请求体 | ✅ 不含敏感信息 |
| `.env.example` | —（需要被跟踪） | ✅ 所有值都是通用默认值 | ✅ 可提交 |
| 构建产物 `frontend/dist/` | ✅ 被忽略 | — | ✅ 不会提交 |
| 数据集目录 `data/` | ✅ `import/*` 忽略，`processed/` 和 `rejected/` 忽略 | ❌ 尚未填充真实数据 | ❌ 填充数据前需逐项审查 |
## 声明

- ✅ T7-T8 已完成：构造数据、字段结构、分类校验、价格校验、数据隔离、配置环境区分
- ✅ T9 已完成：只读查询接口（8 个 GET 接口），见上方"已实现接口"
- ✅ T10 已完成：组合筛选接口（keyword、category_major、category_minor、budget、flavor、is_packable 参数，AND 关系）
- ✅ T11 已完成：反馈提交接口（POST /api/feedback，免登录，关联校验，独立持久化；仅提供提交接口，不提供管理员查询、审核和删除接口）
- ✅ T12-T20 已完成：前端全部 11 个页面开发（主页、轮盘抽取、推荐、菜品详情、检索、食堂列表、窗口列表、窗口菜品、必吃榜、反馈、404），路由注册，组件库（7 个通用组件），前后端联调通过，构建通过
- ✅ T21 已完成：必吃榜占位（不调接口）+ 新手引导预留路由（/onboarding）+ 路由文件清理
- ✅ T22 已完成：前后端端到端联调与 MVP 最终验收
- ✅ 后端测试：81 个测试全部通过
- ✅ 前端构建：通过（168ms，67 模块）
- ✅ 手动联调：4 条主流程全部验证通过
- ❌ 未实现 Excel 完整导入
- ❌ 未实现 E2E 自动化测试（手动联调已验证全部主流程通过）
- ❌ 学校服务器和真实 Excel 仍未确认
- ❌ 未修改数据模型来预留未来功能
- ❌ 未改变技术栈
- ❌ 未实现搜索、推荐、登录、纠错、管理员上传、AI 功能
