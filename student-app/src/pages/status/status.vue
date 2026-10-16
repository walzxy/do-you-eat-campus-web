<template>
  <view class="status-page">
    <view class="status-decoration status-decoration--one" />
    <view class="status-decoration status-decoration--two" />

    <view class="status-content">
      <view class="brand-block">
        <text class="brand-name">今天吃了么</text>
        <text class="brand-slogan">选个好状态，吃顿好饭吧～</text>
      </view>

      <FoodBowlIllustration />

      <view class="status-heading">
        <text class="heading-title">今日状态</text>
        <text class="heading-description">选择你今天的身体状态，系统会为你推荐更合适的菜品</text>
      </view>

      <view class="status-grid">
        <StatusCard
          v-for="option in statusOptions"
          :key="option.value"
          :option="option"
          :selected="selectedStatus === option.value"
          @select="selectedStatus = $event"
        />
      </view>

      <button class="primary-button confirm-button" @click="confirmStatus">确定</button>
      <text class="local-note">仅用于今天的推荐，可随时在首页或“我的”中修改</text>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import FoodBowlIllustration from '../../components/FoodBowlIllustration.vue'
import StatusCard from '../../components/StatusCard.vue'
import { getAnonymousIdentity, getTodayStatus, saveTodayStatus, STATUS_OPTIONS } from '../../services/localState'

const statusOptions = STATUS_OPTIONS
const selectedStatus = ref('normal')
const isEditing = ref(false)

onLoad((query = {}) => {
  getAnonymousIdentity()
  isEditing.value = query.edit === '1'
  const todayStatus = getTodayStatus()

  if (todayStatus) {
    selectedStatus.value = todayStatus.status
    if (!isEditing.value) {
      uni.switchTab({ url: '/pages/eat/eat' })
    }
  }
})

function confirmStatus() {
  saveTodayStatus(selectedStatus.value)
  uni.switchTab({ url: '/pages/eat/eat' })
}
</script>

<style scoped>
.status-page {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  overflow: hidden;
  background: var(--bg);
}

.status-content {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
  max-width: 750rpx;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74rpx 34rpx calc(46rpx + env(safe-area-inset-bottom));
}

.brand-block {
  text-align: center;
}

.brand-name,
.brand-slogan {
  display: block;
}

.brand-name {
  color: var(--text);
  font-size: 44rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
}

.brand-slogan {
  margin-top: 10rpx;
  color: var(--muted);
  font-size: 26rpx;
}

.status-heading {
  margin-top: 12rpx;
}

.heading-title,
.heading-description {
  display: block;
  text-align: center;
}

.heading-title {
  color: var(--text);
  font-size: 38rpx;
  font-weight: 800;
}

.heading-description {
  margin: 12rpx auto 0;
  color: var(--muted);
  font-size: 25rpx;
  line-height: 1.55;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 28rpx;
}

.status-grid > :last-child {
  grid-column: 1;
}

.confirm-button {
  width: 100%;
  margin-top: 30rpx;
}

.local-note {
  display: block;
  margin-top: 18rpx;
  color: #b49a89;
  font-size: 22rpx;
  text-align: center;
}

.status-decoration {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 150, 63, 0.12);
}

.status-decoration--one {
  top: -100rpx;
  right: -110rpx;
  width: 300rpx;
  height: 300rpx;
}

.status-decoration--two {
  bottom: 110rpx;
  left: -180rpx;
  width: 340rpx;
  height: 340rpx;
  background: rgba(255, 210, 164, 0.2);
}
</style>
