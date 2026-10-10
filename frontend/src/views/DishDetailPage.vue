<template>
  <div><PageHeader title="菜品详情" />
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :text="error" />
    <div v-else-if="dish" class="detail-page">
      <div class="detail-placeholder">{{ icon }}</div>
      <h1 class="detail-name">{{ dish.dish_name }}</h1>
      <div class="detail-meta">
        <p><strong>食堂：</strong>{{ dish.cafeteria_name || dish.cafeteria_id }}</p>
        <p><strong>窗口：</strong>{{ dish.window_name || dish.window_id }}</p>
        <p><strong>价格：</strong>{{ displayPrice }}</p>
        <p><strong>口味：</strong><span class="tag">{{ dish.flavor || '未标注' }}</span></p>
        <p><strong>打包：</strong>{{ dish.is_packable || '未知' }}</p>
        <p><strong>供应状态：</strong>{{ dish.supply_status || '未知' }}</p>
      </div>
      <button class="eat-this-btn" @click="$router.push('/')">{{ eatIcon }} 就吃这个</button>
    </div>
    <EmptyState v-else text="菜品未找到" />
  </div>
</template>
<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import LoadingState from '../components/LoadingState.vue';
import ErrorState from '../components/ErrorState.vue';
import EmptyState from '../components/EmptyState.vue';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export default {
  name: 'DishDetailPage',
  components: { PageHeader, LoadingState, ErrorState, EmptyState },
  setup() {
    const route = useRoute();
    const dish = ref(null);
    const loading = ref(true);
    const error = ref('');
    const icon = '\u{1F372}';
    const eatIcon = '\u{1F389}';
    const displayPrice = computed(() => {
      if (!dish.value) return '';
      return dish.value.price_min === dish.value.price_max
        ? (dish.value.price_min + ' 元')
        : (dish.value.price_min + '-' + dish.value.price_max + ' 元');
    });
    onMounted(async () => {
      try {
        const res = await fetch(API_BASE + '/dishes/' + route.params.dishId);
        if (!res.ok) { error.value = '菜品不存在'; dish.value = null; }
        else { const json = await res.json(); dish.value = json.data; }
      } catch (e) { error.value = '网络错误，请稍后重试'; }
      finally { loading.value = false; }
    });
    return { dish, loading, error, displayPrice, icon, eatIcon };
  },
};
</script>
<style scoped>
.detail-page { padding:20px 16px; text-align:center; }
.detail-placeholder { font-size:96px; margin-bottom:16px; }
.detail-name { font-size:24px; margin-bottom:20px; }
.detail-meta { text-align:left; max-width:320px; margin:0 auto 24px; }
.detail-meta p { margin-bottom:8px; font-size:15px; }
.tag { color:#e65100; background:#fff3e0; padding:2px 8px; border-radius:4px; }
.eat-this-btn { padding:14px 40px; font-size:18px; background:#e74c3c; color:#fff; border:none; border-radius:24px; cursor:pointer; }
</style>
