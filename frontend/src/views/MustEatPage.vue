<template>
  <div>
    <PageHeader title="必吃榜" />
    <div class="must-eat-placeholder">
      <p class="me-icon">{{ icon }}</p>
      <p class="me-text">敬请期待</p>
    </div>
  </div>
</template>

<script>
import PageHeader from '../components/PageHeader.vue';
export default {
  name: 'MustEatPage',
  components: { PageHeader },
  data() { return { icon: '\u{1F374}' }; },
};
</script>

<style scoped>
.must-eat-placeholder { text-align: center; padding: 80px 20px; color: #999; }
.me-icon { font-size: 64px; margin-bottom: 16px; }
.me-text { font-size: 18px; }
</style>
