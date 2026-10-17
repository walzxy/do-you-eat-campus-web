<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="eyebrow">随手挑一个</text>
      <text class="page-title">瀑布盲盒墙</text>
      <text class="page-subtitle">候选菜品已经按今日状态筛过，点开一张盲盒看看会遇见什么。</text>

      <view class="wall-toolbar">
        <view>
          <text class="wall-count">今日盲盒</text>
          <text class="wall-caption">{{ loading ? '正在准备…' : `${dishes.length} 张可选卡片` }}</text>
        </view>
        <button class="refresh-button" :disabled="loading" @click="loadDishes">换一批</button>
      </view>

      <view v-if="error" class="error-card soft-card">{{ error }}</view>
      <view v-else-if="loading" class="loading-card soft-card">盲盒正在落下来…</view>
      <view v-else-if="!dishes.length" class="empty-card soft-card">暂时没有可选盲盒，可以换个状态再试试。</view>
      <view v-else class="waterfall-grid">
        <view
          v-for="(dish, index) in dishes"
          :key="dish.dish_id"
          class="blind-box"
          :class="[`blind-box--${(index % 4) + 1}`, { revealed: revealedId === dish.dish_id }]"
          @click="revealDish(dish)"
        >
          <text class="blind-box-mark">{{ revealedId === dish.dish_id ? '🍜' : '？' }}</text>
          <text class="blind-box-label">{{ revealedId === dish.dish_id ? dish.title : '打开看看' }}</text>
          <text class="blind-box-number">NO.{{ String(index + 1).padStart(2, '0') }}</text>
        </view>
      </view>
    </view>

    <DishDetailModal
      :dish="featured"
      :visible="detailVisible"
      secondary-label="继续挑"
      @close="closeDetail"
      @secondary="closeDetail"
      @confirm="confirmDish"
    />
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import DishDetailModal from '../../components/DishDetailModal.vue'
import { fetchCandidates } from '../../services/dishService'
import { addHistoryRecord, getTodayStatus } from '../../services/localState'

const dishes = ref([])
const featured = ref(null)
const revealedId = ref('')
const detailVisible = ref(false)
const loading = ref(false)
const error = ref('')

onLoad(loadDishes)

async function loadDishes() {
  loading.value = true
  error.value = ''
  detailVisible.value = false
  featured.value = null
  revealedId.value = ''
  try {
    dishes.value = (await fetchCandidates({ status: getTodayStatus()?.status || 'normal' })).slice(0, 18)
  } catch (requestError) {
    dishes.value = []
    error.value = requestError.message || '盲盒墙读取失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function revealDish(dish) {
  featured.value = dish
  revealedId.value = dish.dish_id
  detailVisible.value = true
}

function closeDetail() {
  detailVisible.value = false
}

function confirmDish() {
  if (!featured.value) return
  addHistoryRecord(featured.value)
  detailVisible.value = false
  uni.showToast({ title: '已记入饭录', icon: 'success' })
}
</script>

<style scoped>
.wall-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 42rpx;
}

.wall-count,
.wall-caption {
  display: block;
}

.wall-count {
  color: var(--text);
  font-size: 30rpx;
  font-weight: 800;
}

.wall-caption {
  margin-top: 6rpx;
  color: var(--muted);
  font-size: 22rpx;
}

.refresh-button {
  height: 64rpx;
  margin: 0;
  padding: 0 22rpx;
  border: 2rpx solid var(--border);
  border-radius: 32rpx;
  background: #fff;
  color: var(--dark-orange);
  font-size: 23rpx;
  line-height: 60rpx;
}

.waterfall-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 18rpx;
  margin-top: 24rpx;
}

.blind-box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 224rpx;
  padding: 24rpx 16rpx;
  overflow: hidden;
  border: 2rpx solid rgba(242, 215, 190, 0.9);
  border-radius: 30rpx;
  background: linear-gradient(145deg, #fff0df, #ffe0bb);
  box-shadow: 0 14rpx 30rpx rgba(173, 105, 50, 0.09);
  transform: translateY(0);
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.blind-box:active {
  transform: scale(0.97);
}

.blind-box--2 {
  min-height: 286rpx;
  background: linear-gradient(145deg, #ffe8cf, #ffd2a0);
}

.blind-box--3 {
  min-height: 252rpx;
  background: linear-gradient(145deg, #fff4e8, #ffdfc0);
}

.blind-box--4 {
  min-height: 310rpx;
  background: linear-gradient(145deg, #ffe3c5, #ffc891);
}

.blind-box.revealed {
  background: #fffaf5;
  box-shadow: 0 18rpx 36rpx rgba(233, 111, 36, 0.16);
}

.blind-box-mark {
  color: var(--dark-orange);
  font-size: 64rpx;
  font-weight: 800;
}

.blind-box-label,
.blind-box-number {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blind-box-label {
  margin-top: 16rpx;
  color: var(--text);
  font-size: 26rpx;
  font-weight: 800;
}

.blind-box-number {
  margin-top: 8rpx;
  color: #b49a89;
  font-size: 19rpx;
  letter-spacing: 2rpx;
}

.error-card,
.loading-card,
.empty-card {
  margin-top: 24rpx;
  padding: 32rpx 24rpx;
  color: var(--muted);
  font-size: 24rpx;
  text-align: center;
}

.error-card {
  color: #b84f31;
}
</style>
