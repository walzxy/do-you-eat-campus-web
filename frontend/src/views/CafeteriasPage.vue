<template>
  <div><PageHeader title="食堂列表" />
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :text="error" />
    <EmptyState v-else-if="cafeterias.length === 0" text="暂无食堂数据" />
    <div v-else class="cafeteria-list">
      <div v-for="c in cafeterias" :key="c.cafeteria_id" class="cafeteria-card" @click="$router.push('/cafeterias/' + c.cafeteria_id + '/windows')">
        <div class="cafeteria-placeholder">{{ icon }}</div>
        <div class="cafeteria-info">
          <h3>{{ c.cafeteria_name }}</h3>
          <p class="campus">{{ c.campus }}</p>
          <p class="remark">{{ c.remark || '' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue';
import PageHeader from '../components/PageHeader.vue';
import LoadingState from '../components/LoadingState.vue';
import ErrorState from '../components/ErrorState.vue';
import EmptyState from '../components/EmptyState.vue';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export default {
  name: 'CafeteriasPage',
  components: { PageHeader, LoadingState, ErrorState, EmptyState },
  setup() {
    const icon = '\u{1F3ED}'; const cafeterias = ref([]); const loading = ref(true); const error = ref('');
    onMounted(async () => {
      try { const res = await fetch(API_BASE + '/cafeterias'); const json = await res.json(); cafeterias.value = json.data.data; }
      catch (e) { error.value = '加载食堂列表失败'; }
      finally { loading.value = false; }
    });
    return { icon, cafeterias, loading, error };
  },
};
</script>
<style scoped>
.cafeteria-list { padding:8px 0; }
.cafeteria-card { display:flex; gap:12px; padding:12px 16px; cursor:pointer; border-bottom:1px solid #f0f0f0; }
.cafeteria-card:active { background:#f9f9f9; }
.cafeteria-placeholder { font-size:32px; flex-shrink:0; }
.cafeteria-info { flex:1; }
.cafeteria-info h3 { font-size:16px; margin-bottom:4px; }
.campus { font-size:13px; color:#888; margin-bottom:2px; }
.remark { font-size:13px; color:#aaa; }
</style>
