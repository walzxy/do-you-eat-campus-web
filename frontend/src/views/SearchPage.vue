<template>
  <div><PageHeader title="检索" />
    <div class="search-page">
      <div class="search-actions">
        <button class="action-btn" @click="$router.push('/cafeterias')">{{ cafIcon }} 看看食堂</button>
      </div>
      <div class="search-box">
        <input v-model="keyword" placeholder="输入菜品关键词" @keyup.enter="doSearch" />
        <button class="search-btn" @click="doSearch">{{ searchIcon }}</button>
      </div>
      <div v-if="searched">
        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :text="error" />
        <EmptyState v-else-if="dishes.length === 0" text="没有找到匹配的菜品" />
        <DishList v-else :dishes="dishes" />
      </div>
      <div v-else class="must-eat-section">
        <p class="must-eat-placeholder">{{ mustEatIcon }} 必吃榜：敬请期待</p>
      </div>
    </div>
  </div>
</template>
<script>
import { ref } from 'vue';
import PageHeader from '../components/PageHeader.vue';
import DishList from '../components/DishList.vue';
import LoadingState from '../components/LoadingState.vue';
import ErrorState from '../components/ErrorState.vue';
import EmptyState from '../components/EmptyState.vue';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export default {
  name: 'SearchPage',
  components: { PageHeader, DishList, LoadingState, ErrorState, EmptyState },
  setup() {
    const cafIcon = '\u{1F3ED}'; const searchIcon = '\u{1F50D}'; const mustEatIcon = '\u{1F374}';
    const keyword = ref(''); const dishes = ref([]); const loading = ref(false); const error = ref(''); const searched = ref(false);
    const doSearch = async () => {
      if (!keyword.value.trim()) { error.value = '请输入关键词'; searched.value = true; return; }
      loading.value = true; error.value = ''; searched.value = true;
      try {
        const res = await fetch(API_BASE + '/dishes/search?keyword=' + encodeURIComponent(keyword.value.trim()));
        const json = await res.json();
        if (!res.ok) { error.value = json.error?.message || '请求失败'; dishes.value = []; }
        else { dishes.value = json.data.data; }
      } catch (e) { error.value = '网络错误，请稍后重试'; dishes.value = []; }
      finally { loading.value = false; }
    };
    return { cafIcon, searchIcon, mustEatIcon, keyword, dishes, loading, error, searched, doSearch };
  },
};
</script>
<style scoped>
.search-page { padding:16px; }
.search-actions { margin-bottom:16px; }
.action-btn { width:100%; padding:14px; font-size:16px; background:#fff; border:2px solid #e0e0e0; border-radius:12px; cursor:pointer; }
.action-btn:active { background:#f5f5f5; }
.search-box { display:flex; gap:8px; margin-bottom:16px; }
.search-box input { flex:1; padding:10px 12px; border:1px solid #ddd; border-radius:8px; font-size:16px; }
.search-btn { padding:10px 16px; background:#e74c3c; color:#fff; border:none; border-radius:8px; font-size:16px; cursor:pointer; }
.must-eat-section { text-align:center; padding:40px; color:#999; }
.must-eat-placeholder { font-size:18px; }
</style>
