# 项目文件结构

今天吃了么/
  frontend/         # Vue 3 + Vite 前端
    src/
      app/          # （预留，待产品确定后填充）
      components/   # 通用组件（待产品确定后填充）
      pages/        # 页面（待产品确定后填充）
      router/       # 路由定义
      services/     # API 调用
      styles/       # 全局样式
      types/        # 前端数据字段说明
      App.vue       # 根组件
      main.js       # 前端入口
    index.html
    vite.config.js  # Vite 配置
    package.json
  backend/          # Node.js + Express 后端
    src/
      app/          # （预留，待业务确定后填充）
      config/       # 环境变量和配置
      routes/       # API 路由定义
      controllers/  # 请求处理（待业务确定后填充）
      services/     # 业务逻辑
      repositories/ # 数据访问层
      schemas/      # 数据校验规则
      middleware/   # 中间件（错误处理、日志、跨域）
      utils/        # 工具函数
      __tests__/    # Vitest 自动化测试
      app.js        # Express 应用组装
      server.js     # 服务入口
    .env
    vitest.config.js
    package.json
  shared/           # 前后端共享定义
    data-dictionary.md
  data/
    import/         # 待导入 Excel
    processed/      # 处理后的结构化数据
    sample/         # 示例数据
    rejected/       # 导入失败的错误报告
  docs/             # 项目文档
  tests/            # 跨模块公共测试
  .gitignore
  .env.example
  README.md