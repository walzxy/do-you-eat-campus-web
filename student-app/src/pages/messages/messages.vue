<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="page-title">消息</text>
      <text class="page-subtitle">这里会放点赞、回复、收藏和系统通知。</text>
      <view class="message-heading">
        <text class="section-title">最近消息</text>
        <text class="unread-count" v-if="unread">{{ unread }} 条未读</text>
      </view>
      <view v-if="error" class="message-empty soft-card">{{ error }}</view>
      <view v-else-if="!loading && !notifications.length" class="message-empty soft-card">暂时没有新消息。</view>
      <view v-else-if="loading" class="message-empty soft-card">读取中…</view>
      <view v-for="item in notifications" :key="item.notification_id" class="message-row soft-card" :class="{ unread: !item.read_at }" @click="readMessage(item)">
        <view class="message-icon">{{ iconFor(item.type) }}</view>
        <view class="message-copy">
          <text class="message-content">{{ item.content }}</text>
          <text class="message-time">{{ formatTime(item.created_at) }}</text>
        </view>
        <text v-if="!item.read_at" class="unread-dot" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { listNotifications, markNotificationRead } from '../../services/api'

const notifications = ref([])
const unread = ref(0)
const loading = ref(false)
const error = ref('')

onShow(loadMessages)

async function loadMessages() {
  loading.value = true
  error.value = ''
  try {
    const result = await listNotifications()
    notifications.value = result.data || []
    unread.value = result.unread || 0
  } catch (requestError) {
    error.value = requestError.message || '消息读取失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function readMessage(item) {
  if (item.read_at) return
  try {
    await markNotificationRead(item.notification_id)
    item.read_at = new Date().toISOString()
    unread.value = Math.max(0, unread.value - 1)
  } catch {
    // 阅读状态失败不影响消息展示。
  }
}

function iconFor(type) {
  return { like: '♡', favorite: '☆', comment: '💬', reply: '↩️' }[type] || '🔔'
}

function formatTime(value) {
  return new Date(value).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.message-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 44rpx;
}

.unread-count {
  color: var(--dark-orange);
  font-size: 21rpx;
}

.message-row,
.message-empty {
  margin-top: 18rpx;
  padding: 22rpx;
}

.message-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.message-row.unread {
  border-color: var(--main);
}

.message-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70rpx;
  height: 70rpx;
  border-radius: 24rpx;
  background: var(--light-orange);
  color: var(--dark-orange);
  font-size: 32rpx;
}

.message-copy {
  flex: 1;
}

.message-content,
.message-time {
  display: block;
}

.message-content {
  color: var(--text);
  font-size: 24rpx;
}

.message-time {
  margin-top: 8rpx;
  color: var(--muted);
  font-size: 20rpx;
}

.unread-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--main);
}

.message-empty {
  color: var(--muted);
  font-size: 24rpx;
  text-align: center;
}
</style>
