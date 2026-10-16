<template>
  <view class="page-shell">
    <view class="content-width">
      <view class="eat-header">
        <view>
          <text class="eyebrow">今天吃了么</text>
          <text class="page-title">今天想吃点什么？</text>
          <text class="page-subtitle">根据你的今日状态，慢慢挑一顿合适的饭。</text>
        </view>
        <view class="status-pill" @click="editStatus">
          <text class="status-pill-dot" />
          <text>{{ statusLabel }}</text>
        </view>
      </view>

      <view class="quick-card soft-card">
        <view class="quick-icon">🍚</view>
        <view class="quick-copy">
          <text class="quick-title">从一顿合适的饭开始</text>
          <text class="quick-description">先选你的方式，后面会结合口味和食堂帮你缩小范围。</text>
        </view>
      </view>

      <view class="section-heading">
        <text class="section-title">选择方式</text>
        <text class="section-caption">三种轻松入口，先从你现在最想玩的开始</text>
      </view>

      <view class="choice-list">
        <view class="choice-card soft-card" @click="showComingSoon('转盘')">
          <text class="choice-emoji">🎡</text>
          <view class="choice-copy">
            <text class="choice-title">转盘</text>
            <text class="choice-description">让今天的选择交给一点点运气</text>
          </view>
          <text class="choice-arrow">›</text>
        </view>
        <view class="choice-card soft-card" @click="showComingSoon('选一选')">
          <text class="choice-emoji">📝</text>
          <view class="choice-copy">
            <text class="choice-title">选一选</text>
            <text class="choice-description">按预算、食堂和口味慢慢筛选</text>
          </view>
          <text class="choice-arrow">›</text>
        </view>
        <view class="choice-card soft-card" @click="showComingSoon('盲盒墙')">
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

onShow(() => {
  todayStatus.value = getTodayStatus()
})

function editStatus() {
  uni.navigateTo({ url: '/pages/status/status?edit=1' })
}

function showComingSoon(feature) {
  uni.showToast({ title: `${feature}正在准备中`, icon: 'none' })
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

.quick-card {
  display: flex;
  align-items: center;
  margin-top: 44rpx;
  padding: 26rpx;
}

.quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92rpx;
  height: 92rpx;
  border-radius: 30rpx;
  background: #ffe1bd;
  font-size: 48rpx;
}

.quick-copy {
  flex: 1;
  margin-left: 20rpx;
}

.quick-title,
.quick-description,
.choice-title,
.choice-description {
  display: block;
}

.quick-title {
  color: var(--text);
  font-size: 29rpx;
  font-weight: 800;
}

.quick-description {
  margin-top: 8rpx;
  color: var(--muted);
  font-size: 23rpx;
  line-height: 1.55;
}

.section-heading {
  margin-top: 54rpx;
}

.choice-list {
  margin-top: 22rpx;
}

.choice-card {
  display: flex;
  align-items: center;
  margin-bottom: 18rpx;
  padding: 26rpx 24rpx;
}

.choice-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 84rpx;
  border-radius: 28rpx;
  background: #fff0df;
  font-size: 42rpx;
}

.choice-copy {
  flex: 1;
  margin-left: 20rpx;
}

.choice-title {
  color: var(--text);
  font-size: 30rpx;
  font-weight: 800;
}

.choice-description {
  margin-top: 8rpx;
  color: var(--muted);
  font-size: 23rpx;
}

.choice-arrow {
  color: var(--main);
  font-size: 46rpx;
  font-weight: 300;
}
</style>
