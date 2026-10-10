<template>
  <div><PageHeader title="推荐" />
    <div class="recommend-page">
      <div class="category-panel">
        <div class="major-placeholder">{{ majorIcon }}</div>
        <h3 class="major-name">{{ categoryMajor || '全部' }}</h3>
        <div class="minor-list">
          <button v-for="m in minors" :key="m" :class="['minor-btn', { active: selectedMinor === m }]" @click="selectMinor(m)">{{ m }}</button>
          <button v-if="minors.length > 0" :class="['minor-btn', { active: !selectedMinor }]" @click="selectMinor('')">全部</button>
        </div>
      </div>
      <div class="dish-area">
        <DishFilters v-model:budget="budget" v-model:flavor="flavor" v-model:isPackable="isPackable" @clear="clearFilters" />
        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :text="error" />
        <EmptyState v-else-if="dishes.length === 0" text="没有找到匹配的菜品" />
        <DishList v-else :dishes="dishes" />
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import DishFilters from '../components/DishFilters.vue';
import DishList from '../components/DishList.vue';
import LoadingState from '../components/LoadingState.vue';
import ErrorState from '../components/ErrorState.vue';
import EmptyState from '../components/EmptyState.vue';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export default {
  name: 'RecommendPage',
  components: { PageHeader, DishFilters, DishList, LoadingState, ErrorState, EmptyState },
  setup() {
    const route = useRoute();
    const majorIcon = '\u{1F372}';
    const categoryMajor = ref(route.query.category_major || '');
    const selectedMinor = ref('');
    const minors = ref([]);
    const dishes = ref([]);
    const loading = ref(false);
    const error = ref('');
    const budget = ref('');
    const flavor = ref('');
    const isPackable = ref('');
    const fetchMinors = async () => {
      if (!categoryMajor.value) return;
      try { const res = await fetch(API_BASE + '/dishes/search?category_major=' + encodeURIComponent(categoryMajor.value)); const json = await res.json(); const minorSet = new Set(); json.data.data.forEach(d => { if (d.category_minor) minorSet.add(d.category_minor); }); minors.value = Array.from(minorSet).sort(); } catch (e) { minors.value = []; }
    };
    const search = async () => {
      loading.value = true; error.value = '';
      try {
        const params = new URLSearchParams();
        if (categoryMajor.value) params.set('category_major', categoryMajor.value);
        if (selectedMinor.value) params.set('category_minor', selectedMinor.value);
        if (budget.value) params.set('budget', budget.value);
        if (flavor.value) params.set('flavor', flavor.value);
        if (isPackable.value) params.set('is_packable', isPackable.value);
        const res = await fetch(API_BASE + '/dishes/search?' + params.toString());
        const json = await res.json();
        if (!res.ok) { error.value = json.error?.message || '请求失败'; dishes.value = []; }
        else { dishes.value = json.data.data; }
      } catch (e) { error.value = '网络错误，请稍后重试'; dishes.value = []; }
      finally { loading.value = false; }
    };
    const selectMinor = (m) => { selectedMinor.value = m; };
    const clearFilters = () => { budget.value = ''; flavor.value = ''; isPackable.value = ''; };
    onMounted(() => { fetchMinors(); });
    watch([selectedMinor, budget, flavor, isPackable], search);
    watch(categoryMajor, () => { selectedMinor.value = ''; minors.value = []; fetchMinors(); });
    search();
    return { majorIcon, categoryMajor, selectedMinor, minors, dishes, loading, error, budget, flavor, isPackable, selectMinor, clearFilters };
  },
};
</script>
<style scoped>
.recommend-page { display:flex; flex-direction:column; }
.category-panel { padding:16px; text-align:center; border-bottom:1px solid #eee; }
.major-placeholder { font-size:64px; margin-bottom:8px; }
.major-name { font-size:20px; margin-bottom:12px; }
.minor-list { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; }
.minor-btn { padding:6px 14px; border:1px solid #ddd; border-radius:16px; background:#fff; font-size:13px; cursor:pointer; }
.minor-btn.active { background:#e74c3c; color:#fff; border-color:#e74c3c; }
.dish-area { flex:1; }
</style>
