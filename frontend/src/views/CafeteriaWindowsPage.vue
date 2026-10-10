<template>
  <div><PageHeader :title="cafeteriaName || '窗口列表'" />
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :text="error" />
    <EmptyState v-else-if="windows.length === 0" text="该食堂暂无窗口" />
    <div v-else class="window-list">
      <div v-for="w in windows" :key="w.window_id" class="window-card" @click="$router.push('/windows/' + w.window_id + '/dishes')">
        <div class="window-placeholder">{{ icon }}</div>
        <div class="window-info">
          <h3>{{ w.window_name }}</h3>
          <p class="window-remark">{{ w.remark || '' }}</p>
          <p class="window-cafeteria">{{ cafeteriaName }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import LoadingState from '../components/LoadingState.vue';
import ErrorState from '../components/ErrorState.vue';
import EmptyState from '../components/EmptyState.vue';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export default {
  name: 'CafeteriaWindowsPage',
  components: { PageHeader, LoadingState, ErrorState, EmptyState },
  setup() {
    const route = useRoute(); const icon = '\u{1F374}'; const windows = ref([]); const cafeteriaName = ref(''); const loading = ref(true); const error = ref('');
    onMounted(async () => {
      try {
        const res = await fetch(API_BASE + '/cafeterias/' + route.params.cafeteriaId);
        if (!res.ok) { error.value = '食堂不存在'; return; }
        const json = await res.json(); cafeteriaName.value = json.data.cafeteria_name; windows.value = json.data.windows || [];
      } catch (e) { error.value = '加载窗口列表失败'; }
      finally { loading.value = false; }
    });
    return { icon, windows, cafeteriaName, loading, error };
  },
};
</script>
<style scoped>
.window-list { padding:8px 0; }
.window-card { display:flex; gap:12px; padding:12px 16px; cursor:pointer; border-bottom:1px solid #f0f0f0; }
.window-card:active { background:#f9f9f9; }
.window-placeholder { font-size:32px; flex-shrink:0; }
.window-info { flex:1; }
.window-info h3 { font-size:16px; margin-bottom:4px; }
.window-remark { font-size:13px; color:#888; margin-bottom:2px; }
.window-cafeteria { font-size:12px; color:#aaa; }
</style>
