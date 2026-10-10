import os

base = r"c:\Users\24664\Desktop\今天吃了么\frontend\src"
d = os.path.join(base, "views")
os.makedirs(d, exist_ok=True)

files = {
    "HomePage.vue": '''<template>
  <div class="home-page">
    <h1 class="app-title">今天吃了吗</h1>
    <div class="entry-list">
      <button class="entry-btn" @click="$router.push('/wheel')">{{ spinIcon }} 抽取</button>
      <button class="entry-btn" @click="$router.push('/search')">{{ searchIcon }} 直接检索</button>
      <button class="entry-btn" @click="$router.push('/feedback')">{{ feedbackIcon }} 反馈</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
  data() {
    return {
      spinIcon: '\\u{1F3B2}',
      searchIcon: '\\u{1F50D}',
      feedbackIcon: '\\u{1F4AC}',
    };
  },
};
</script>

<style scoped>
.home-page { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; }
.app-title { font-size:28px; font-weight:700; margin-bottom:40px; }
.entry-list { width:100%; max-width:320px; display:flex; flex-direction:column; gap:16px; }
.entry-btn { display:flex; align-items:center; justify-content:center; gap:8px; padding:16px; font-size:18px; background:#fff; border:2px solid #e0e0e0; border-radius:12px; cursor:pointer; color:#333; }
.entry-btn:active { background:#f5f5f5; border-color:#ccc; }
</style>''',

    "NotFoundPage.vue": '''<template>
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
export default { name: 'NotFoundPage', components: { PageHeader }, data() { return { icon: '\\u{1F615}' }; } };
</script>
<style scoped>
.not-found { text-align:center; padding:80px 20px; }
.nf-icon { font-size:64px; margin-bottom:16px; }
.nf-text { font-size:18px; color:#888; margin-bottom:24px; }
.nf-btn { padding:10px 24px; font-size:16px; border:1px solid #ddd; border-radius:8px; background:#fff; cursor:pointer; }
</style>''',

    "MustEatPage.vue": '''<template>
  <div><PageHeader title="必吃榜" />
    <div class="must-eat-placeholder">
      <p class="me-icon">{{ icon }}</p>
      <p class="me-text">敬请期待</p>
    </div>
  </div>
</template>
<script>
import PageHeader from '../components/PageHeader.vue';
export default { name: 'MustEatPage', components: { PageHeader }, data() { return { icon: '\\u{1F374}' }; } };
</script>
<style scoped>
.must-eat-placeholder { text-align:center; padding:80px 20px; color:#999; }
.me-icon { font-size:64px; margin-bottom:16px; }
.me-text { font-size:18px; }
</style>''',
}

for name, c in files.items():
    with open(os.path.join(d, name), "w", encoding="utf8") as f:
        f.write(c)
    print("OK:", name)
print("V1 DONE")