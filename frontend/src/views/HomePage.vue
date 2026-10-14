<template>
  <div class="home-page">
    <h1 class="app-title">今天吃了吗</h1>
    <div class="entry-list">
      <button class="entry-btn" @click="$router.push('/wheel')">{{ spinIcon }} 抽取</button>
      <button class="entry-btn" @click="$router.push('/search')">{{ searchIcon }} 直接检索</button>
    </div>
    <button class="feedback-btn" @click="$router.push('/feedback')">{{ feedbackIcon }} 反馈</button>
    <button class="admin-entry-btn" @click="$router.push('/admin')">管理</button>
  </div>
</template>
<script>
export default {
  name: 'HomePage',
  data() { return { spinIcon: '\u{1F3B2}', searchIcon: '\u{1F50D}', feedbackIcon: '\u{1F4AC}' }; },
};
</script>
<style scoped>
.home-page { min-height:100vh; position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; }
.app-title { font-size:28px; font-weight:700; margin-bottom:40px; }
.entry-list { width:100%; max-width:320px; display:flex; flex-direction:column; gap:16px; }
.entry-btn { display:flex; align-items:center; justify-content:center; gap:8px; padding:16px; font-size:18px; background:#fff; border:2px solid #e0e0e0; border-radius:12px; cursor:pointer; color:#333; }
.entry-btn:active { background:#f5f5f5; border-color:#ccc; }
.feedback-btn { position:absolute; right:20px; bottom:24px; padding:8px 10px; border:1px solid #ddd; border-radius:16px; background:#fff; color:#777; font-size:13px; cursor:pointer; }
.feedback-btn:active { background:#f5f5f5; }
.admin-entry-btn { position:absolute; right:20px; bottom:68px; padding:6px 10px; border:1px solid #e0e0e0; border-radius:16px; background:#fafafa; color:#aaa; font-size:12px; cursor:pointer; }
.admin-entry-btn:active { background:#f0f0f0; }
</style>
