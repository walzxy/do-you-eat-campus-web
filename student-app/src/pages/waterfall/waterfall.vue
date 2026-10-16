<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="eyebrow">随手抽一个</text>
      <text class="page-title">瀑布盲盒墙</text>
      <text class="page-subtitle">每张卡片都来自当前菜品数据，抽到后可以查看详情并记录。</text>

      <view class="draw-card soft-card">
        <view class="draw-emoji">🎁</view>
        <view class="draw-copy">
          <text class="draw-title">今天的盲盒</text>
          <text class="draw-result">{{ featured?.title || (loading ? '正在准备…' : '点击按钮抽取') }}</text>
        </view>
        <button class="draw-button" :disabled="loading || !dishes.length" @click="draw">抽一个</button>
      </view>

      <view v-if="error" class="error-card soft-card">{{ error }}</view>
      <view class="waterfall-grid">
        <DishCard v-for="dish in dishes" :key="dish.dish_id" :dish="dish" @open="openDish" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import DishCard from '../../components/DishCard.vue'
import { fetchCandidates, pickRandom } from '../../services/dishService'
import { getTodayStatus } from '../../services/localState'

const dishes = ref([])
const featured = ref(null)
const loading = ref(false)
const error = ref('')

onLoad(loadDishes)

async function loadDishes() {
  loading.value = true
  error.value = ''
  try {
    const candidates = await fetchCandidates({ status: getTodayStatus()?.status || 'normal' })
    dishes.value = candidates.slice(0, 18)
    featured.value = pickRandom(dishes.value)
  } catch (requestError) {
    dishes.value = []
    error.value = requestError.message || '盲盒墙读取失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function draw() {
  featured.value = pickRandom(dishes.value)
  if (featured.value) {
    uni.showToast({ title: '抽到啦', icon: 'success' })
  }
}

function openDish(dish) {
  uni.navigateTo({ url: `/pages/dish-detail/dish-detail?dishId=${encodeURIComponent(dish.dish_id)}` })
}
</script>

<style scoped>
.draw-card {
  display: flex;
  align-items: center;
  margin-top: 44rpx;
  padding: 22rpx;
}

.draw-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 84rpx;
  border-radius: 28rpx;
  background: #ffe1bd;
  font-size: 42rpx;
}

.draw-copy {
  flex: 1;
  min-width: 0;
  margin-left: 18rpx;
}

.draw-title,
.draw-result {
  display: block;
}

.draw-title {
  color: var(--muted);
  font-size: 22rpx;
}

.draw-result {
  margin-top: 8rpx;
  overflow: hidden;
  color: var(--text);
  font-size: 27rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draw-button {
  height: 68rpx;
  margin: 0;
  padding: 0 22rpx;
  border-radius: 34rpx;
  background: var(--main);
  color: #fff;
  font-size: 24rpx;
  line-height: 68rpx;
}

.waterfall-grid {
  margin-top: 28rpx;
}

.error-card {
  margin-top: 18rpx;
  padding: 26rpx;
  color: #b84f31;
  font-size: 24rpx;
  text-align: center;
}
</style>
