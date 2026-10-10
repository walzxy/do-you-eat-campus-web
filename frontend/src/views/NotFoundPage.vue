<template>
  <div><PageHeader title="404" />
    <div class="not-found">
      <p class="nf-icon">{{ icon }}</p>
      <p class="nf-text">页面不存在</p>
      <button class="nf-btn" @click="$router.push('/')">返回主页</button>
    </div>
  </div>
</template>
<script>
import PageHeader from '../components/PageHeader.vue';
export default { name: 'NotFoundPage', components: { PageHeader }, data() { return { icon: '\u{1F615}' }; } };
</script>
<style scoped>
.not-found { text-align:center; padding:80px 20px; }
.nf-icon { font-size:64px; margin-bottom:16px; }
.nf-text { font-size:18px; color:#888; margin-bottom:24px; }
.nf-btn { padding:10px 24px; font-size:16px; border:1px solid #ddd; border-radius:8px; background:#fff; cursor:pointer; }
</style>
