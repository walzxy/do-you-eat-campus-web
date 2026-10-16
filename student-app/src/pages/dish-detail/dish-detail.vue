<template>
  <view class="page-shell">
    <view class="content-width">
      <view v-if="loading" class="loading-card soft-card">正在读取菜品详情…</view>
      <view v-else-if="error" class="error-card soft-card">{{ error }}</view>
      <template v-else-if="dish">
        <view class="detail-hero soft-card">
          <view class="detail-art">🍜</view>
          <text class="detail-title">{{ dish.title }}</text>
          <text class="detail-price">{{ dish.priceText }}</text>
        </view>

        <view class="detail-info soft-card">
          <view class="info-row"><text>位置</text><text>{{ dish.locationText }}</text></view>
          <view class="info-row"><text>分类</text><text>{{ dish.category_major || '待补充' }}</text></view>
          <view class="info-row"><text>口味</text><text>{{ dish.flavor || '未知' }}</text></view>
          <view class="info-row"><text>打包</text><text>{{ dish.is_packable || '未知' }}</text></view>
          <view class="info-row"><text>状态</text><text>{{ dish.availability_status || '待核实' }}</text></view>
        </view>

        <button class="primary-button" :disabled="recorded" @click="recordDish">{{ recorded ? '已记入饭录' : '就这个，记入饭录' }}</button>
        <text class="detail-note">记录只代表你选择了这道菜，不会自动发布到社区。</text>
      </template>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getDish } from '../../services/api'
import { addHistoryRecord } from '../../services/localState'
import { normalizeDish } from '../../services/dishService'

const dish = ref(null)
const loading = ref(false)
const error = ref('')
const recorded = ref(false)

onLoad(async ({ dishId } = {}) => {
  if (!dishId) {
    error.value = '缺少菜品编号'
    return
  }
  loading.value = true
  try {
    dish.value = normalizeDish(await getDish(dishId))
  } catch (requestError) {
    error.value = requestError.message || '菜品详情读取失败'
  } finally {
    loading.value = false
  }
})

function recordDish() {
  if (!dish.value || recorded.value) return
  addHistoryRecord(dish.value)
  recorded.value = true
  uni.showToast({ title: '已记入饭录', icon: 'success' })
}
</script>

<style scoped>
.loading-card,
.error-card {
  margin-top: 44rpx;
  padding: 34rpx 24rpx;
  color: var(--muted);
  font-size: 26rpx;
  text-align: center;
}

.error-card {
  color: #b84f31;
}

.detail-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 44rpx;
  padding: 42rpx 24rpx;
}

.detail-art {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150rpx;
  height: 150rpx;
  border-radius: 48rpx;
  background: #ffe1bd;
  font-size: 72rpx;
}

.detail-title {
  margin-top: 26rpx;
  color: var(--text);
  font-size: 38rpx;
  font-weight: 800;
  text-align: center;
}

.detail-price {
  margin-top: 12rpx;
  color: var(--dark-orange);
  font-size: 30rpx;
  font-weight: 750;
}

.detail-info {
  margin-top: 22rpx;
  padding: 8rpx 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 28rpx;
  padding: 22rpx 0;
  border-bottom: 2rpx solid rgba(242, 215, 190, 0.6);
  color: var(--muted);
  font-size: 25rpx;
}

.info-row:last-child {
  border-bottom: 0;
}

.info-row text:last-child {
  color: var(--text);
  text-align: right;
}

.primary-button {
  width: 100%;
  margin-top: 28rpx;
}

.detail-note {
  display: block;
  margin-top: 18rpx;
  color: #b49a89;
  font-size: 22rpx;
  text-align: center;
}
</style>
