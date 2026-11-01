<template>
  <view class="page-shell">
    <view class="content-width">
      <view class="eat-header">
        <view>
          <text class="eyebrow">今天吃了么</text>
          <text class="page-title">今天想吃点什么？</text>
          <text class="page-subtitle">选个方向，今天这顿就有着落。</text>
        </view>
        <view class="status-pill" @click="editStatus">
          <text class="status-pill-dot" />
          <text>{{ statusLabel }}</text>
        </view>
      </view>

      <view class="quick-section">
        <text class="quick-heading">快速找一顿</text>
        <scroll-view scroll-x="true" class="quick-scroll">
          <view class="quick-tags">
            <text v-for="tag in quickTags" :key="tag.label" class="quick-tag" @click="openQuickTag(tag)">{{ tag.label }}</text>
          </view>
        </scroll-view>
      </view>

      <view class="section-heading">
        <text class="section-title">选择方式</text>
        <text class="section-caption">想随机，还是按条件慢慢挑？</text>
      </view>

      <view class="choice-list">
        <view class="choice-card soft-card" @click="openFeature('/pages/wheel/wheel')">
          <text class="choice-emoji">🎡</text>
          <view class="choice-copy">
            <text class="choice-title">转盘</text>
            <text class="choice-description">让今天的选择交给一点点运气</text>
          </view>
          <text class="choice-arrow">›</text>
        </view>
        <view class="choice-card soft-card" @click="openFeature('/pages/choose/choose')">
          <text class="choice-emoji">📝</text>
          <view class="choice-copy">
            <text class="choice-title">选一选</text>
            <text class="choice-description">按预算、食堂和口味慢慢筛选</text>
          </view>
          <text class="choice-arrow">›</text>
        </view>
        <view class="choice-card soft-card" @click="openFeature('/pages/waterfall/waterfall')">
          <text class="choice-emoji">🎁</text>
          <view class="choice-copy">
            <text class="choice-title">瀑布盲盒墙</text>
            <text class="choice-description">随手抽一个，看看今天会遇见什么</text>
          </view>
          <text class="choice-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getTodayStatus, STATUS_OPTIONS } from '../../services/localState'

const todayStatus = ref(getTodayStatus())
const statusLabel = computed(() => STATUS_OPTIONS.find((item) => item.value === todayStatus.value?.status)?.label || '正常')
const quickTags = [
  { label: '15 元内', query: 'budget=15' },
  { label: '来碗热汤', query: 'keyword=%E6%B1%A4' },
  { label: '二食堂', query: 'cafeteriaId=C002' },
  { label: '想吃肉', query: 'keyword=%E8%82%89' }
]

onShow(() => {
  todayStatus.value = getTodayStatus()
})

function editStatus() {
  uni.navigateTo({ url: '/pages/status/status?edit=1' })
}

function openFeature(url) {
  uni.navigateTo({ url })
}

function openQuickTag(tag) {
  uni.navigateTo({ url: `/pages/choose/choose?${tag.query}&auto=1` })
}
</script>

<style scoped>
.eat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.status-pill {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8rpx;
  margin-top: 22rpx;
  padding: 14rpx 18rpx;
  border: 2rpx solid var(--border);
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.7);
  color: var(--dark-orange);
  font-size: 23rpx;
}

.status-pill-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--main);
}

.quick-section { margin-top: 38rpx; }
.quick-heading { display: block; color: var(--text); font-size: 27rpx; font-weight: 800; }
.quick-scroll { width: 100%; margin-top: 16rpx; white-space: nowrap; }
.quick-tags { display: inline-flex; gap: 12rpx; padding-bottom: 6rpx; }
.quick-tag { padding: 14rpx 20rpx; border: 2rpx solid var(--border); border-radius: 28rpx; background: #fff; color: var(--dark-orange); font-size: 24rpx; }
.quick-tag:active { background: var(--light-orange); }

.choice-title,
.choice-description {
  display: block;
}

.section-heading {
  margin-top: 34rpx;
}

.choice-list {
  margin-top: 22rpx;
}

.choice-card {
  display: flex;
  align-items: center;
  margin-bottom: 18rpx;
  padding: 30rpx 26rpx;
}

.choice-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  height: 100rpx;
  border-radius: 28rpx;
  background: #fff0df;
  font-size: 50rpx;
}

.choice-copy {
  flex: 1;
  margin-left: 20rpx;
}

.choice-title {
  color: var(--text);
  font-size: 33rpx;
  font-weight: 800;
}

.choice-description {
  margin-top: 8rpx;
  color: var(--muted);
  font-size: 21rpx;
}

.choice-arrow {
  color: var(--main);
  font-size: 46rpx;
  font-weight: 300;
}
</style>
