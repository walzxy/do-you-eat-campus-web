<template>
  <div><PageHeader title="抽取" />
    <div class="wheel-page">
      <div class="wheel-categories">
        <span v-for="cat in categories" :key="cat" class="wheel-cat">{{ cat }}</span>
      </div>
      <button class="spin-btn" @click="spin" :disabled="spinning">{{ spinning ? '抽取中...' : spinLabel }}</button>
      <div v-if="result" class="result-overlay" @click.self="closeResult">
        <div class="result-modal">
          <div class="result-icon">{{ partyIcon }}</div>
          <h2 class="result-title">抽中了</h2>
          <p class="result-category">{{ result }}</p>
          <div class="result-actions">
            <button class="action-btn again-btn" @click="closeResult">{{ againIcon }} 换一个</button>
            <button class="action-btn confirm-btn" @click="confirm">{{ confirmIcon }} 就这个</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export default {
  name: 'WheelPage',
  components: { PageHeader },
  setup() {
    const router = useRouter();
    const categories = ref([]);
    const spinning = ref(false);
    const result = ref(null);
    const spinLabel = '\u{1F3B2} \u4E00\u952E\u62BD\u53D6';
    const partyIcon = '\u{1F389}';
    const againIcon = '\u{1F504}';
    const confirmIcon = '\u{1F389}';
    onMounted(async () => {
      try { const res = await fetch(API_BASE + '/dishes/search'); const json = await res.json(); const majorSet = new Set(); json.data.data.forEach(d => { if (d.category_major) majorSet.add(d.category_major); }); categories.value = Array.from(majorSet).sort(); } catch (e) { categories.value = ['米线面条', '盖浇饭', '麻辣烫', '自选快餐', '焗饭意面', '铁板石锅']; }
    });
    const spin = () => { if (spinning.value || categories.value.length === 0) return; spinning.value = true; setTimeout(() => { result.value = categories.value[Math.floor(Math.random() * categories.value.length)]; spinning.value = false; }, 2000); };
    const closeResult = () => { result.value = null; };
    const confirm = () => { router.push('/recommend?category_major=' + encodeURIComponent(result.value)); };
    return { categories, spinning, result, spin, closeResult, confirm, spinLabel, partyIcon, againIcon, confirmIcon };
  },
};
</script>
<style scoped>
.wheel-page { padding:20px 16px; }
.wheel-categories { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-bottom:32px; }
.wheel-cat { padding:8px 16px; background:#f5f5f5; border-radius:20px; font-size:14px; color:#666; }
.spin-btn { display:block; margin:0 auto; padding:14px 32px; font-size:18px; background:#e74c3c; color:#fff; border:none; border-radius:24px; cursor:pointer; }
.spin-btn:disabled { opacity:0.6; }
.result-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:200; }
.result-modal { background:#fff; border-radius:16px; padding:32px 24px; text-align:center; width:80%; max-width:360px; }
.result-icon { font-size:64px; margin-bottom:8px; }
.result-title { font-size:20px; color:#888; margin-bottom:8px; }
.result-category { font-size:28px; font-weight:700; margin-bottom:24px; }
.result-actions { display:flex; gap:12px; justify-content:center; }
.action-btn { padding:12px 24px; border-radius:12px; font-size:16px; cursor:pointer; border:none; }
.again-btn { background:#f0f0f0; color:#333; }
.confirm-btn { background:#e74c3c; color:#fff; }
</style>
