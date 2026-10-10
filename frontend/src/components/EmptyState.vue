<template>
  <div class="empty-state">
    <p class="empty-icon">{{ icon }}</p>
    <p class="empty-text">{{ text }}</p>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: { text: { type: String, default: '\u6682\u65E0\u6570\u636E' } },
  data() { return { icon: '\u{1F4C4}' }; },
};
</script>

<style scoped>
.empty-state { text-align:center; padding:60px 20px; color:#999; }
.empty-icon { font-size:48px; margin-bottom:12px; }
.empty-text { font-size:16px; }
</style>