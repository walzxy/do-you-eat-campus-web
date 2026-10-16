<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="eyebrow">我的</text>
      <text class="page-title">把喜欢的口味记下来</text>
      <text class="page-subtitle">当前使用匿名账号，不收集额外个人资料。</text>

      <view class="profile-card soft-card">
        <view class="avatar">🍊</view>
        <view class="profile-copy">
          <text class="profile-name">今天也要好好吃饭</text>
          <text class="profile-id">匿名账号 · {{ anonymousId }}</text>
        </view>
      </view>

      <view class="section-heading">
        <text class="section-title">今日状态</text>
        <text class="section-caption">随时可以修改，修改后会影响后续推荐</text>
      </view>
      <view class="soft-card setting-row" @click="editStatus">
        <text class="setting-icon">🌤️</text>
        <text class="setting-label">{{ statusLabel }}</text>
        <text class="choice-arrow">›</text>
      </view>

      <view class="section-heading">
        <text class="section-title">历史饭录</text>
        <text class="section-caption">“就这个”确认过的菜品会出现在这里</text>
      </view>
      <view v-if="history.length === 0" class="soft-card history-empty">
        <text>还没有记录，下一顿从喜欢的开始吧。</text>
      </view>
      <view v-else class="history-list">
        <view v-for="record in history" :key="record.id" class="soft-card history-row">
          <view>
            <text class="history-name">{{ record.dish.name }}</text>
            <text class="history-time">{{ formatDate(record.eatenAt) }}</text>
          </view>
          <button class="delete-button" @click="removeRecord(record.id)">删除</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getAnonymousIdentity, getHistory, getTodayStatus, removeHistoryRecord, STATUS_OPTIONS } from '../../services/localState'

const anonymousId = ref(getAnonymousIdentity().id.slice(-8))
const todayStatus = ref(getTodayStatus())
const history = ref(getHistory())
const statusLabel = computed(() => STATUS_OPTIONS.find((item) => item.value === todayStatus.value?.status)?.label || '正常')

onShow(() => {
  todayStatus.value = getTodayStatus()
  history.value = getHistory()
})

function editStatus() {
  uni.navigateTo({ url: '/pages/status/status?edit=1' })
}

function removeRecord(id) {
  uni.showModal({
    title: '删除这条饭录？',
    content: '删除后无法恢复，但不会影响菜品数据。',
    success: ({ confirm }) => {
      if (confirm) history.value = removeHistoryRecord(id)
    }
  })
}

function formatDate(value) {
  return new Date(value).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.profile-card {
  display: flex;
  align-items: center;
  margin-top: 44rpx;
  padding: 28rpx;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  height: 100rpx;
  border-radius: 34rpx;
  background: #ffe1bd;
  font-size: 48rpx;
}

.profile-copy {
  margin-left: 22rpx;
}

.profile-name,
.profile-id {
  display: block;
}

.profile-name {
  color: var(--text);
  font-size: 29rpx;
  font-weight: 800;
}

.profile-id {
  margin-top: 8rpx;
  color: var(--muted);
  font-size: 22rpx;
}

.section-heading {
  margin-top: 52rpx;
}

.setting-row,
.history-row {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
  padding: 24rpx;
}

.setting-icon {
  font-size: 38rpx;
}

.setting-label {
  flex: 1;
  margin-left: 18rpx;
  color: var(--text);
  font-size: 28rpx;
  font-weight: 700;
}

.choice-arrow {
  color: var(--main);
  font-size: 46rpx;
}

.history-empty {
  margin-top: 20rpx;
  padding: 34rpx 24rpx;
  color: var(--muted);
  font-size: 25rpx;
  text-align: center;
}

.history-row {
  justify-content: space-between;
}

.history-name,
.history-time {
  display: block;
}

.history-name {
  color: var(--text);
  font-size: 28rpx;
  font-weight: 750;
}

.history-time {
  margin-top: 8rpx;
  color: var(--muted);
  font-size: 22rpx;
}

.delete-button {
  height: 62rpx;
  margin: 0;
  padding: 0 20rpx;
  border: 2rpx solid #f1c7ac;
  border-radius: 31rpx;
  background: #fff8ef;
  color: var(--dark-orange);
  font-size: 23rpx;
  line-height: 58rpx;
}
</style>
