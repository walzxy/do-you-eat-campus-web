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

        <view class="rating-card soft-card">
          <text class="rating-title">给这道菜打个分</text>
          <view class="rating-stars">
            <text v-for="value in 5" :key="value" :class="['rating-star', { active: value <= rating } ]" @click="rating = value">★</text>
          </view>
          <button class="small-action" :disabled="!rating || ratingSaving" @click="saveRating">{{ ratingSaving ? '保存中…' : '保存评分' }}</button>
        </view>
        <button class="primary-button" :disabled="recorded" @click="recordDish">{{ recorded ? '已记入饭录' : '就这个，记入饭录' }}</button>
        <button class="share-button" @click="shareToCommunity">分享到社区</button>
        <text class="detail-note">饭录和社区分享可以分别操作，匿名账号不会展示个人资料。</text>
      </template>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { createCommunityPost, getDish, rateDish, syncHistoryRecord } from '../../services/api'
import { addHistoryRecord } from '../../services/localState'
import { normalizeDish } from '../../services/dishService'

const dish = ref(null)
const loading = ref(false)
const error = ref('')
const recorded = ref(false)
const rating = ref(0)
const ratingSaving = ref(false)

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
  const record = addHistoryRecord(dish.value)
  syncHistoryRecord(record).catch(() => {})
  recorded.value = true
  uni.showToast({ title: '已记入饭录', icon: 'success' })
}

async function saveRating() {
  if (!dish.value || !rating.value) return
  ratingSaving.value = true
  try {
    await rateDish(dish.value.dish_id, rating.value)
    uni.showToast({ title: '评分已保存', icon: 'success' })
  } catch (requestError) {
    uni.showToast({ title: requestError.message || '评分失败', icon: 'none' })
  } finally {
    ratingSaving.value = false
  }
}

async function shareToCommunity() {
  if (!dish.value) return
  try {
    await createCommunityPost({ content: `我今天吃了「${dish.value.title}」，你呢？`, dish_id: dish.value.dish_id })
    uni.showToast({ title: '已分享到社区', icon: 'success' })
  } catch (requestError) {
    uni.showToast({ title: requestError.message || '分享失败', icon: 'none' })
  }
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

.rating-card {
  margin-top: 22rpx;
  padding: 22rpx;
  text-align: center;
}

.rating-title {
  display: block;
  color: var(--text);
  font-size: 24rpx;
  font-weight: 750;
}

.rating-stars {
  display: flex;
  justify-content: center;
  gap: 10rpx;
  margin-top: 10rpx;
}

.rating-star {
  color: #e5cdbd;
  font-size: 42rpx;
}

.rating-star.active {
  color: var(--main);
}

.small-action,
.share-button {
  height: 64rpx;
  margin: 16rpx auto 0;
  border-radius: 32rpx;
  font-size: 22rpx;
  line-height: 60rpx;
}

.small-action {
  padding: 0 24rpx;
  background: var(--light-orange);
  color: var(--dark-orange);
}

.share-button {
  width: 100%;
  border: 2rpx solid var(--border);
  background: #fff;
  color: var(--dark-orange);
}

.detail-note {
  display: block;
  margin-top: 18rpx;
  color: #b49a89;
  font-size: 22rpx;
  text-align: center;
}
</style>
