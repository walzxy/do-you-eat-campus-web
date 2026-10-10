# 数据字典（共享定义）

## 食堂 (Cafeteria)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cafeteria_id | string | 是 | 食堂编号，格式 C001 |
| cafeteria_name | string | 是 | 食堂名称 |
| campus | string | 否 | 所属校区 |
| remark | string | 否 | 备注 |

## 窗口 (Window)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| window_id | string | 是 | 窗口编号（全校唯一），格式 W001 |
| cafeteria_id | string | 是 | 所属食堂编号 |
| window_name | string | 是 | 窗口显示名称 |
| remark | string | 否 | 备注 |

## 菜品 (Dish)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dish_id | string | 是 | 菜品编号（全局唯一），格式 D001 |
| dish_name | string | 是 | 菜品名称 |
| keywords | string | 否 | 搜索关键词，中文顿号分隔 |
| cafeteria_id | string | 是 | 所属食堂编号 |
| cafeteria_name | string | 否 | 所属食堂名称（冗余，方便阅读） |
| window_id | string | 是 | 所属窗口编号 |
| window_name | string | 否 | 所属窗口名称（冗余，方便阅读） |
| price_min | number | 是 | 价格下限，单值价格和区间价格均适用（单位元） |
| price_max | number | 是 | 价格上限，单值价格时与 price_min 相同（单位元） |
| flavor | string | 否 | 口味标签 |
| category_major | string | 是 | 菜品大类（用于轮盘抽取），如米线面条、米饭套餐 |
| category_minor | string | 否 | 菜品小类（用于推荐页筛选），可为空，如米线、盖浇饭 |
| is_packable | string | 否 | 是否支持打包：是/否/未知 |
| service_period | string | 否 | 供应时段：早餐/午餐/晚餐/全天/未知 |
| availability_status | string | 是 | 供应状态（固定值，见下方） |
| remark | string | 否 | 备注 |
| source | string | 否 | 数据来源 |
| last_verified_date | string | 否 | 最后核对日期 YYYY-MM-DD |

## 供应状态可选值

- 已核实售卖
- 菜单记录，未核实
- 可能售卖
- 暂时未售卖
- 已停止记录
- 未知

## 编号规则

- 食堂编号：C 开头 + 三位数字，如 C001
- 窗口编号：W 开头 + 三位数字，全校唯一，如 W001
- 菜品编号：D 开头 + 三位数字，全局唯一，如 D001

## 数据关系

- 一个食堂 -> 多个窗口
- 一个窗口 -> 多个菜品
- 同名但不同窗口或食堂的菜品 => 不同菜品编号
- 菜品必须属于一个窗口，窗口必须属于一个食堂

## 未确定字段（待确认后补充）

- 菜品图片
- 大小份/多规格价格
- 活动价格
- 实时售罄状态
- 用户评分/评价
- 精确营业时间 HH:MM-HH:MM