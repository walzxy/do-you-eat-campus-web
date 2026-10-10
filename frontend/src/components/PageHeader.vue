<template>
  <div class="page-header">
    <button class="nav-btn back-btn" @click="goBack" v-if="showBack">{{ backIcon }}</button>
    <h2 class="page-title">{{ title }}</h2>
    <button class="nav-btn home-btn" @click="goHome" v-if="showHome">{{ homeIcon }}</button>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
export default {
  name: 'PageHeader',
  props: {
    title: { type: String, default: '' },
    showBack: { type: Boolean, default: true },
    showHome: { type: Boolean, default: true },
  },
  setup() {
    const router = useRouter();
    const goBack = () => { if (window.history.length > 1) router.go(-1); else router.push('/'); };
    const goHome = () => router.push('/');
    const backIcon = '\u2190';
    const homeIcon = '\u2302';
    return { goBack, goHome, backIcon, homeIcon };
  },
};
</script>

<style scoped>
.page-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:#fff; border-bottom:1px solid #eee; position:sticky; top:0; z-index:100; }
.page-title { font-size:18px; font-weight:600; flex:1; text-align:center; }
.nav-btn { background:none; border:none; font-size:22px; cursor:pointer; padding:4px 8px; color:#333; min-width:36px; }
.nav-btn:active { opacity:0.5; }
.back-btn { text-align:left; }
.home-btn { text-align:right; }
</style>