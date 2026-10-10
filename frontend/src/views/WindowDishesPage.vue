<template>
  <div><PageHeader :title="windowName || '窗口菜品'" />
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :text="error" />
    <div v-else>
      <div class="context-bar"><span>{{ cafeteriaName }} &middot; {{ windowName }}</span></div>
      <DishFilters v-model:budget="budget" v-model:flavor="flavor" v-model:isPackable="isPackable" @clear="clearFilters" />
      <EmptyState v-if="filteredDishes.length === 0" text="该窗口暂无菜品" />
      <DishList v-else :dishes="filteredDishes" />
    </div>
  </div>
</template>
<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import DishFilters from '../components/DishFilters.vue';
import DishList from '../components/DishList.vue';
import LoadingState from '../components/LoadingState.vue';
import ErrorState from '../components/ErrorState.vue';
import EmptyState from '../components/EmptyState.vue';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export default {
  name: 'WindowDishesPage',
  components: { PageHeader, DishFilters, DishList, LoadingState, ErrorState, EmptyState },
  setup() {
    const route = useRoute();
    const allDishes = ref([]); const windowName = ref(''); const cafeteriaName = ref(''); const loading = ref(true); const error = ref('');
    const budget = ref(''); const flavor = ref(''); const isPackable = ref('');
    const filteredDishes = computed(() => {
      let result = allDishes.value;
      if (budget.value) { const b = Number(budget.value); if (!isNaN(b)) result = result.filter(d => d.price_max <= b); }
      if (flavor.value) result = result.filter(d => d.flavor && d.flavor.includes(flavor.value));
      if (isPackable.value) result = result.filter(d => d.is_packable === isPackable.value);
      return result;
    });
    onMounted(async () => {
      try {
        const res = await fetch(API_BASE + '/windows/' + route.params.windowId + '/dishes');
        if (!res.ok) { error.value = '窗口不存在'; return; }
        const json = await res.json(); allDishes.value = json.data.data;
        if (allDishes.value.length > 0) { windowName.value = allDishes.value[0].window_name || ''; cafeteriaName.value = allDishes.value[0].cafeteria_name || ''; }
      } catch (e) { error.value = '加载菜品失败'; }
      finally { loading.value = false; }
    });
    const clearFilters = () => { budget.value = ''; flavor.value = ''; isPackable.value = ''; };
    return { allDishes, filteredDishes, windowName, cafeteriaName, loading, error, budget, flavor, isPackable, clearFilters };
  },
};
</script>
<style scoped>
.context-bar { padding:8px 16px; font-size:13px; color:#888; background:#fafafa; border-bottom:1px solid #eee; }
</style>
