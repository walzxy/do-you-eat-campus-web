# API 接口约定

## 基础地址

开发环境：http://localhost:3001/api
生产环境：待学校服务器确定后配置

## 响应格式

成功响应：
```
{
  "success": true,
  "data": {}
}
```

错误响应：
```
{
  "success": false,
  "error": {
    "message": "错误描述"
  }
}
```

## 已实现接口

### GET /api/health

健康检查，返回服务器运行状态。

### GET /api/cafeterias

食堂列表。

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| campus | string | 否 | 按校区筛选（如 `国定路校区`） |

**响应：**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "cafeteria_id": "C001",
        "cafeteria_name": "绿叶餐厅",
        "campus": "国定路校区",
        "remark": "教学大楼旁，一楼"
      }
    ],
    "total": 1
  }
}
```

### GET /api/cafeterias/:cafeteriaId

食堂详情（含窗口列表）。

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| cafeteriaId | string | 食堂编号（如 C001） |

**响应：**
```json
{
  "success": true,
  "data": {
    "cafeteria_id": "C001",
    "cafeteria_name": "绿叶餐厅",
    "campus": "国定路校区",
    "remark": "教学大楼旁，一楼",
    "windows": [
      { "window_id": "W001", "window_name": "米线窗口", ... }
    ]
  }
}
```

### GET /api/cafeterias/:cafeteriaId/windows

指定食堂的窗口列表。

### GET /api/windows/:windowId

窗口详情（含所属食堂信息和菜品列表）。

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| windowId | string | 窗口编号（如 W001） |

### GET /api/windows/:windowId/dishes

指定窗口的菜品列表。

### GET /api/dishes/:dishId

菜品详情。

### GET /api/dishes/search

关键词搜索 + 组合筛选菜品。

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词，匹配 `dish_name` 和 `keywords` 字段 |
| category_major | string | 否 | 大类精确筛选（如 `米线面条`） |
| category_minor | string | 否 | 小类精确筛选（如 `盖浇饭`） |
| budget | number | 否 | 预算上限，筛选 `price_max <= budget` 的菜品 |
| flavor | string | 否 | 口味筛选（子串匹配，兼容多口味标签） |
| is_packable | string | 否 | 打包状态，可选值：`是`、`否`、`未知` |

**规则：**
- 多个条件同时存在时使用 AND 关系
- 无任何筛选参数时返回全部菜品
- `keyword` 为空字符串时忽略
- 无匹配结果返回 200 和空数组（不返回 404）

**参数校验：**
- `budget` 不是数字 → 400
- `budget` 小于 0 → 400
- `is_packable` 不在 `是/否/未知` 中 → 400

### POST /api/feedback

提交用户反馈（免登录）。

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| issue_type | string | 是 | 问题类型，仅允许 `菜品不存在`、`价格不符`、`窗口信息错误`、`供应状态错误`、`其他` |
| description | string | 是 | 补充说明，最长 500 个字符 |
| cafeteria_id | string | 否 | 关联食堂编号 |
| window_id | string | 否 | 关联窗口编号 |
| dish_id | string | 否 | 关联菜品编号 |

**关联校验规则：**
- 如果传入关联编号，必须存在对应的数据
- 如果同时传入多个关联编号，需验证层级关系：
  - `window_id` 必须属于 `cafeteria_id`
  - `dish_id` 必须属于 `window_id`
  - `dish_id` 必须属于 `cafeteria_id`

**成功响应 (201)：**
```json
{
  "success": true,
  "data": {
    "feedback_id": "FB001",
    "status": "pending",
    "created_at": "2026-10-07T00:00:00.000Z"
  }
}
```

**请求示例：**
```json
{
  "issue_type": "价格不符",
  "description": "页面显示 12 元，窗口实际为 15 元",
  "cafeteria_id": "C001",
  "window_id": "W001",
  "dish_id": "D001"
}
```

**错误响应示例：**
```json
{
  "success": false,
  "error": {
    "message": "补充说明不能为空"
  }
}
```

## 错误码

**404 - 资源不存在**
```json
{
  "success": false,
  "error": {
    "message": "食堂不存在: C999"
  }
}
```

**400 - 参数错误**
```json
{
  "success": false,
  "error": {
    "message": "关键词不能为空"
  }
}
```
