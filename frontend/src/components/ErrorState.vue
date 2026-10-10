<template>
  <div class="error-state">
    <p class="error-icon">{{ icon }}</p>
    <p class="error-text">{{ text }}</p>
  </div>
</template>

<script>
export default {
  name: 'ErrorState',
  props: { text: { type: String, default: '\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5' } },
  data() { return { icon: '\u26A0' }; },
};
</script>

<style scoped>
.error-state { text-align:center; padding:60px 20px; color:#e74c3c; }
.error-icon { font-size:48px; margin-bottom:12px; }
.error-text { font-size:16px; }
</style>