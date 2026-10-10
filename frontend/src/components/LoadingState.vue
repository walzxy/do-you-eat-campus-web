<template>
  <div class="loading-state">
    <p class="loading-spinner">{{ icon }}</p>
    <p class="loading-text">{{ text }}</p>
  </div>
</template>

<script>
export default {
  name: 'LoadingState',
  props: { text: { type: String, default: '\u52A0\u8F7D\u4E2D...' } },
  data() { return { icon: '\u231B' }; },
};
</script>

<style scoped>
.loading-state { text-align:center; padding:60px 20px; color:#999; }
.loading-spinner { font-size:48px; margin-bottom:12px; }
.loading-text { font-size:16px; }
</style>