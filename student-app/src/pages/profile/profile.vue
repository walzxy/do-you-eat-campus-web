<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="page-title">我的</text>
      <text class="page-subtitle profile-subtitle">把喜欢的口味记下来</text>
      <text class="profile-note">当前使用匿名账号，不收集生日、性别等额外个人资料。</text>

      <view class="profile-card soft-card">
        <view class="avatar">{{ account.avatar || '🍊' }}</view>
        <view class="profile-copy">
          <text class="profile-name">{{ account.display_name || '匿名用户' }}</text>
          <text class="profile-id">匿名账号 · {{ anonymousId }}</text>
        </view>
        <text class="edit-profile" @click="editingProfile = !editingProfile">编辑</text>
      </view>
      <view v-if="editingProfile" class="edit-profile-card soft-card">
        <input v-model="nickname" class="profile-input" maxlength="24" placeholder="输入昵称" />
        <button class="save-button" :disabled="savingProfile" @click="saveProfile">{{ savingProfile ? '保存中…' : '保存昵称' }}</button>
      </view>

      <view class="section-heading">
        <text class="section-title">个人设置</text>
      </view>
      <view class="soft-card setting-row" @click="openTasteProfile">
        <text class="setting-icon">🍽️</text>
        <text class="setting-label">口味画像与忌口</text>
        <text class="choice-arrow">›</text>
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
        <view v-for="record in history" :key="record.history_id || record.id" class="soft-card history-row">
          <view class="history-main">
            <text class="history-name">{{ dishName(record) }}</text>
            <text class="history-time">{{ formatDate(record.eaten_at || record.eatenAt) }}</text>
            <view v-if="dishId(record)" class="history-rating">
              <text class="rating-label">{{ record.user_rating ? '我的评分' : '给这顿评分' }}</text>
              <text v-for="star in 5" :key="star" class="rating-star" :class="{ active: star <= record.user_rating }" @click="saveHistoryRating(record, star)">{{ ratingSavingId === (record.history_id || record.id) ? '·' : '★' }}</text>
            </view>
          </view>
          <button class="delete-button" @click="removeRecord(record)">删除</button>
        </view>
      </view>

      <button class="danger-button" @click="requestDeleteAccount">注销匿名账号</button>
      <text class="admin-entry" @click="openAdmin">管理员入口</text>
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import {
  deleteAccount,
  deleteAccountHistory,
  ensureAccountSession,
  getAccount,
  getAccountHistory,
  rateDish,
  updateAccount
} from '../../services/api'
import { getAnonymousIdentity, getHistory, getTodayStatus, removeHistoryRecord, resetAnonymousIdentity, STATUS_OPTIONS } from '../../services/localState'

const anonymousId = ref(getAnonymousIdentity().id.slice(-8))
const account = ref({ display_name: '匿名用户', avatar: '🍊' })
const nickname = ref('匿名用户')
const editingProfile = ref(false)
const savingProfile = ref(false)
const ratingSavingId = ref('')
const todayStatus = ref(getTodayStatus())
const history = ref(getHistory())
const statusLabel = computed(() => STATUS_OPTIONS.find((item) => item.value === todayStatus.value?.status)?.label || '正常')

onShow(async () => {
  todayStatus.value = getTodayStatus()
  await loadAccount()
})

async function loadAccount() {
  try {
    await ensureAccountSession()
    const [profile, remoteHistory] = await Promise.all([getAccount(), getAccountHistory()])
    account.value = profile.account || account.value
    nickname.value = account.value.display_name || '匿名用户'
    const remote = remoteHistory.data || []
    const remoteClientIds = new Set(remote.map(item => item.client_id).filter(Boolean))
    history.value = [...remote, ...getHistory().filter(item => !remoteClientIds.has(item.id))]
      .sort((a, b) => new Date(b.eaten_at || b.eatenAt) - new Date(a.eaten_at || a.eatenAt))
  } catch (error) {
    console.warn('[Account] 读取个人资料失败', error)
    history.value = getHistory()
  }
}

async function saveProfile() {
  savingProfile.value = true
  try {
    account.value = await updateAccount({ display_name: nickname.value.trim() || '匿名用户' })
    editingProfile.value = false
    uni.showToast({ title: '昵称已保存', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    savingProfile.value = false
  }
}

function openTasteProfile() {
  uni.navigateTo({ url: '/pages/taste/taste' })
}

function editStatus() {
  uni.navigateTo({ url: '/pages/status/status?edit=1' })
}

function openAdmin() {
  uni.navigateTo({ url: '/pages/admin-login/admin-login' })
}

function dishId(record) {
  return record.dish_id || record.dish_snapshot?.dish_id || record.dish?.dish_id
}

async function saveHistoryRating(record, stars) {
  const id = dishId(record)
  if (!id || ratingSavingId.value) return
  ratingSavingId.value = record.history_id || record.id
  try {
    await rateDish(id, stars)
    history.value = history.value.map(item => dishId(item) === id ? { ...item, user_rating: stars } : item)
    uni.showToast({ title: `已评 ${stars} 星`, icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '评分失败', icon: 'none' })
  } finally {
    ratingSavingId.value = ''
  }
}

function removeRecord(record) {
  uni.showModal({
    title: '删除这条饭录？',
    content: '删除后无法恢复，但不会影响菜品数据。',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        if (record.history_id) await deleteAccountHistory(record.history_id)
      } catch (error) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
        return
      }
      const clientId = record.id || record.client_id
      if (clientId) removeHistoryRecord(clientId)
      history.value = history.value.filter(item => item !== record)
    }
  })
}

function dishName(record) {
  return record.dish_snapshot?.dish_name || record.dish?.dish_name || record.dish?.name || '未命名菜品'
}

function requestDeleteAccount() {
  uni.showModal({
    title: '注销匿名账号？',
    content: '账号资料、口味画像和饭录会删除；已经发布的帖子和评论会保留并显示为“已注销用户”。',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await deleteAccount()
        resetAnonymousIdentity()
        uni.showToast({ title: '账号已注销', icon: 'success' })
        setTimeout(() => uni.reLaunch({ url: '/pages/status/status' }), 500)
      } catch (error) {
        uni.showToast({ title: error.message || '注销失败', icon: 'none' })
      }
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

.profile-subtitle {
  margin-top: 10rpx;
}

.profile-note {
  display: block;
  margin-top: 6rpx;
  color: #b49a89;
  font-size: 21rpx;
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
  flex: 1;
  margin-left: 22rpx;
}

.edit-profile {
  color: var(--dark-orange);
  font-size: 22rpx;
}

.edit-profile-card,
.taste-card {
  margin-top: 18rpx;
  padding: 24rpx;
}

.profile-input {
  box-sizing: border-box;
  width: 100%;
  height: 72rpx;
  padding: 0 18rpx;
  border: 2rpx solid var(--border);
  border-radius: 18rpx;
  background: #fff;
  color: var(--text);
  font-size: 24rpx;
}

.save-button {
  height: 68rpx;
  margin: 18rpx 0 0;
  border-radius: 34rpx;
  background: var(--dark-orange);
  color: #fff;
  font-size: 23rpx;
  line-height: 68rpx;
}

.taste-label {
  display: block;
  color: var(--text);
  font-size: 24rpx;
  font-weight: 750;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
}

.taste-chip {
  padding: 12rpx 18rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: #fff;
  color: var(--muted);
  font-size: 22rpx;
}

.taste-chip.active {
  border-color: var(--main);
  background: var(--light-orange);
  color: var(--dark-orange);
  font-weight: 700;
}

.avoid-label {
  margin-top: 24rpx;
}

.avoid-label + .profile-input {
  margin-top: 12rpx;
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

.history-main { flex: 1; min-width: 0; }
.history-rating { display: flex; align-items: center; gap: 8rpx; margin-top: 14rpx; }
.rating-label { margin-right: 6rpx; color: var(--muted); font-size: 21rpx; }
.rating-star { color: #d9c4b5; font-size: 32rpx; line-height: 1; }
.rating-star.active { color: var(--main); }

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

.admin-entry {
  display: block;
  margin-top: 70rpx;
  color: #c7aea0;
  font-size: 22rpx;
  text-align: center;
}

.danger-button {
  width: 100%;
  margin-top: 42rpx;
  border: 2rpx solid #edc5b7;
  border-radius: 28rpx;
  background: transparent;
  color: #b84f31;
  font-size: 22rpx;
}
</style>
