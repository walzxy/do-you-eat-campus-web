import os, sys, json

base = r"c:\Users\24664\Desktop\今天吃了么\frontend\src"
d = os.path.join(base, "components")
os.makedirs(d, exist_ok=True)

# Part 1: Write files directly
files_to_write = {
    "PageHeader.vue": '''<template>
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
    const backIcon = '\\u2190';
    const homeIcon = '\\u2302';
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
</style>''',

    "EmptyState.vue": '''<template>
  <div class="empty-state">
    <p class="empty-icon">{{ icon }}</p>
    <p class="empty-text">{{ text }}</p>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: { text: { type: String, default: '\\u6682\\u65E0\\u6570\\u636E' } },
  data() { return { icon: '\\u{1F4C4}' }; },
};
</script>

<style scoped>
.empty-state { text-align:center; padding:60px 20px; color:#999; }
.empty-icon { font-size:48px; margin-bottom:12px; }
.empty-text { font-size:16px; }
</style>''',

    "LoadingState.vue": '''<template>
  <div class="loading-state">
    <p class="loading-spinner">{{ icon }}</p>
    <p class="loading-text">{{ text }}</p>
  </div>
</template>

<script>
export default {
  name: 'LoadingState',
  props: { text: { type: String, default: '\\u52A0\\u8F7D\\u4E2D...' } },
  data() { return { icon: '\\u231B' }; },
};
</script>

<style scoped>
.loading-state { text-align:center; padding:60px 20px; color:#999; }
.loading-spinner { font-size:48px; margin-bottom:12px; }
.loading-text { font-size:16px; }
</style>''',

    "ErrorState.vue": '''<template>
  <div class="error-state">
    <p class="error-icon">{{ icon }}</p>
    <p class="error-text">{{ text }}</p>
  </div>
</template>

<script>
export default {
  name: 'ErrorState',
  props: { text: { type: String, default: '\\u52A0\\u8F7D\\u5931\\u8D25\\uFF0C\\u8BF7\\u7A0D\\u540E\\u91CD\\u8BD5' } },
  data() { return { icon: '\\u26A0' }; },
};
</script>

<style scoped>
.error-state { text-align:center; padding:60px 20px; color:#e74c3c; }
.error-icon { font-size:48px; margin-bottom:12px; }
.error-text { font-size:16px; }
</style>''',
}

for name, c in files_to_write.items():
    with open(os.path.join(d, name), "w", encoding="utf8") as f:
        f.write(c)
    print("OK:", name)
print("PART1 DONE")