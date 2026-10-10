import os

base = r"c:\Users\24664\Desktop\今天吃了么\frontend\src"
d = os.path.join(base, "components")

content = {
    "DishCard.vue": '''<template>
  <div class="dish-card" @click="goDetail">
    <div class="dish-placeholder">{{ icon }}</div>
    <div class="dish-info">
      <h3 class="dish-name">{{ dish.dish_name }}</h3>
      <p class="dish-location">{{ dish.cafeteria_name || dish.cafeteria_id }} &middot; {{ dish.window_name || dish.window_id }}</p>
      <p class="dish-price">{{ displayPrice }}</p>
      <p class="dish-tags">
        <span class="tag flavor-tag">{{ dish.flavor || '\\u672A\\u6807\\u6CE8' }}</span>
        <span class="tag pack-tag">{{ dish.is_packable || '\\u672A\\u77E5' }}</span>
        <span class="tag status-tag">{{ dish.supply_status || '\\u672A\\u77E5' }}</span>
      </p>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
export default {
  name: 'DishCard',
  props: { dish: { type: Object, required: true } },
  setup(props) {
    const router = useRouter();
    const goDetail = () => router.push('/dish/' + props.dish.dish_id);
    const icon = '\\u{1F372}';
    const displayPrice = props.dish.price_min === props.dish.price_max
      ? (props.dish.price_min + ' \\u5143')
      : (props.dish.price_min + '-' + props.dish.price_max + ' \\u5143');
    return { goDetail, displayPrice, icon };
  },
};
</script>

<style scoped>
.dish-card { display:flex; gap:12px; padding:12px; margin:8px 16px; background:#fff; border-radius:8px; box-shadow:0 1px 4px rgba(0,0,0,0.08); cursor:pointer; }
.dish-card:active { box-shadow:0 1px 2px rgba(0,0,0,0.12); }
.dish-placeholder { width:72px; height:72px; background:#f0f0f0; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:32px; flex-shrink:0; }
.dish-info { flex:1; min-width:0; }
.dish-name { font-size:16px; font-weight:600; margin-bottom:4px; }
.dish-location { font-size:13px; color:#888; margin-bottom:4px; }
.dish-price { font-size:15px; font-weight:600; color:#e74c3c; margin-bottom:6px; }
.dish-tags { display:flex; flex-wrap:wrap; gap:4px; }
.tag { font-size:11px; padding:2px 6px; border-radius:4px; background:#f0f0f0; color:#666; }
.flavor-tag { background:#fff3e0; color:#e65100; }
.pack-tag { background:#e8f5e9; color:#2e7d32; }
.status-tag { background:#e3f2fd; color:#1565c0; }
</style>''',

    "DishList.vue": '''<template>
  <div class="dish-list">
    <DishCard v-for="dish in dishes" :key="dish.dish_id" :dish="dish" />
  </div>
</template>

<script>
import DishCard from './DishCard.vue';
export default {
  name: 'DishList',
  components: { DishCard },
  props: { dishes: { type: Array, default: () => [] } },
};
</script>

<style scoped>
.dish-list { padding-bottom: 16px; }
</style>''',

    "DishFilters.vue": '''<template>
  <div class="dish-filters">
    <div class="filter-group">
      <label>\\u9884\\u7B97\\u4E0A\\u9650\\uFF08\\u5143\\uFF09</label>
      <input type="number" :value="budget" @input="onBudget" placeholder="\\u4E0D\\u9650" min="0" />
    </div>
    <div class="filter-group">
      <label>\\u53E3\\u5473</label>
      <select :value="flavor" @change="onFlavor">
        <option value="">\\u4E0D\\u9650</option>
        <option value="\\u6E05\\u6DE1">\\u6E05\\u6DE1</option>
        <option value="\\u8FA3">\\u8FA3</option>
        <option value="\\u5FAE\\u8FA3">\\u5FAE\\u8FA3</option>
        <option value="\\u9178\\u8FA3">\\u9178\\u8FA3</option>
        <option value="\\u9EBB\\u8FA3">\\u9EBB\\u8FA3</option>
        <option value="\\u9999\\u8FA3">\\u9999\\u8FA3</option>
        <option value="\\u751C">\\u751C</option>
        <option value="\\u54B8">\\u54B8</option>
        <option value="\\u9178\\u751C">\\u9178\\u751C</option>
      </select>
    </div>
    <div class="filter-group">
      <label>\\u6253\\u5305</label>
      <select :value="isPackable" @change="onPackable">
        <option value="">\\u4E0D\\u9650</option>
        <option value="\\u662F">\\u662F</option>
        <option value="\\u5426">\\u5426</option>
        <option value="\\u672A\\u77E5">\\u672A\\u77E5</option>
      </select>
    </div>
    <button class="clear-btn" @click="\\$emit('clear')">\\u6E05\\u9664\\u7B5B\\u9009</button>
  </div>
</template>

<script>
export default {
  name: 'DishFilters',
  props: {
    budget: { type: [Number, String], default: '' },
    flavor: { type: String, default: '' },
    isPackable: { type: String, default: '' },
  },
  emits: ['update:budget', 'update:flavor', 'update:isPackable', 'clear'],
  methods: {
    onBudget(e) { this.\\$emit('update:budget', e.target.value); },
    onFlavor(e) { this.\\$emit('update:flavor', e.target.value); },
    onPackable(e) { this.\\$emit('update:isPackable', e.target.value); },
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
</style>''',
}

for name, c in content.items():
    with open(os.path.join(d, name), "w", encoding="utf8") as f:
        f.write(c)
    print("OK:", name)
print("PART2 DONE")