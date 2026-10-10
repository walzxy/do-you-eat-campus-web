<template>
  <div class="dish-card" @click="goDetail">
    <div class="dish-placeholder">{{ icon }}</div>
    <div class="dish-info">
      <h3 class="dish-name">{{ dish.dish_name }}</h3>
      <p class="dish-location">{{ dish.cafeteria_name || dish.cafeteria_id }} &middot; {{ dish.window_name || dish.window_id }}</p>
      <p class="dish-price">{{ displayPrice }}</p>
      <p class="dish-tags">
        <span class="tag flavor-tag">{{ dish.flavor || '\u672A\u6807\u6CE8' }}</span>
        <span class="tag pack-tag">{{ dish.is_packable || '\u672A\u77E5' }}</span>
        <span class="tag status-tag">{{ dish.supply_status || '\u672A\u77E5' }}</span>
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
    const icon = '\u{1F372}';
    const displayPrice = props.dish.price_min === props.dish.price_max
      ? (props.dish.price_min + ' \u5143')
      : (props.dish.price_min + '-' + props.dish.price_max + ' \u5143');
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
</style>