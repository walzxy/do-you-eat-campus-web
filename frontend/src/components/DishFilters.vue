<template>
  <div class="dish-filters">
    <div class="filter-group">
      <label>预算上限（元）</label>
      <input type="number" :value="budget" @input="onBudget" placeholder="不限" min="0" />
    </div>
    <div class="filter-group">
      <label>口味</label>
      <select :value="flavor" @change="onFlavor">
        <option value="">不限</option>
        <option value="清淡">清淡</option>
        <option value="辣">辣</option>
        <option value="微辣">微辣</option>
        <option value="酸辣">酸辣</option>
        <option value="麻辣">麻辣</option>
        <option value="香辣">香辣</option>
        <option value="甜">甜</option>
        <option value="咸">咸</option>
        <option value="酸甜">酸甜</option>
      </select>
    </div>
    <div class="filter-group">
      <label>打包</label>
      <select :value="isPackable" @change="onPackable">
        <option value="">不限</option>
        <option value="是">是</option>
        <option value="否">否</option>
        <option value="未知">未知</option>
      </select>
    </div>
    <button class="clear-btn" @click="$emit('clear')">清除筛选</button>
  </div>
</template>
<script>
export default {
  name: 'DishFilters',
  props: { budget: { type: [Number, String], default: '' }, flavor: { type: String, default: '' }, isPackable: { type: String, default: '' } },
  emits: ['update:budget', 'update:flavor', 'update:isPackable', 'clear'],
  methods: {
    onBudget(e) { this.$emit('update:budget', e.target.value); },
    onFlavor(e) { this.$emit('update:flavor', e.target.value); },
    onPackable(e) { this.$emit('update:isPackable', e.target.value); },
  },
};
</script>
<style scoped>
.dish-filters { display:flex; flex-wrap:wrap; gap:8px; padding:12px 16px; background:#fafafa; border-bottom:1px solid #eee; align-items:flex-end; }
.filter-group { display:flex; flex-direction:column; gap:2px; }
.filter-group label { font-size:12px; color:#888; }
.filter-group input, .filter-group select { padding:6px 8px; border:1px solid #ddd; border-radius:4px; font-size:14px; min-width:72px; }
.clear-btn { padding:6px 12px; background:none; border:1px solid #ddd; border-radius:4px; font-size:13px; cursor:pointer; color:#666; }
.clear-btn:active { background:#f0f0f0; }
</style>
