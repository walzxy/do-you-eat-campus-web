<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="eyebrow">随机一点</text>
      <text class="page-title">今天交给转盘</text>
      <text class="page-subtitle">候选菜品来自当前数据，会避开已下架项目，并按今日状态做轻量排序。</text>

      <view class="wheel-board soft-card">
        <view class="wheel-ring" :class="{ 'wheel-ring--spinning': spinning }">
          <view class="wheel-core">{{ displayDish ? '🍜' : '？' }}</view>
        </view>
        <text class="wheel-caption">{{ displayDish?.title || '准备好了吗？' }}</text>
        <text class="wheel-count">{{ loading ? '正在读取菜品…' : `已准备 ${candidates.length} 个候选` }}</text>
      </view>

      <view v-if="error" class="error-card soft-card">{{ error }}</view>
      <button class="primary-button spin-button" :disabled="loading || spinning || !candidates.length" @click="spin">
        {{ spinning ? '转呀转…' : '开始抽取' }}
      </button>
      <button class="muted-button" @click="reload">重新读取候选</button>

      <view v-if="result" class="result-card soft-card">
        <text class="result-kicker">这次抽到</text>
        <text class="result-title">{{ result.title }}</text>
        <text class="result-meta">{{ result.priceText }} · {{ result.locationText }}</text>
        <view class="result-actions">
          <button class="muted-button action-button" @click="spin">换一个</button>
          <button class="primary-button action-button" @click="confirmResult">就这个</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { addHistoryRecord, getTodayStatus } from '../../services/localState'
import { fetchCandidates, pickRandom } from '../../services/dishService'

const candidates = ref([])
const displayDish = ref(null)
const result = ref(null)
const loading = ref(false)
const spinning = ref(false)
const error = ref('')

onLoad(reload)

async function reload() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    candidates.value = await fetchCandidates({ status: getTodayStatus()?.status || 'normal' })
    displayDish.value = candidates.value[0] || null
  } catch (requestError) {
    candidates.value = []
    displayDish.value = null
    error.value = requestError.message || '菜品读取失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function spin() {
  if (spinning.value || !candidates.value.length) return
  spinning.value = true
  result.value = null
  let rounds = 0
  const timer = setInterval(() => {
    displayDish.value = candidates.value[Math.floor(Math.random() * candidates.value.length)]
    rounds += 1
    if (rounds >= 10) {
      clearInterval(timer)
      result.value = pickRandom(candidates.value)
      displayDish.value = result.value
      spinning.value = false
    }
  }, 90)
}

function confirmResult() {
  if (!result.value) return
  addHistoryRecord(result.value)
  uni.showToast({ title: '已记入饭录', icon: 'success' })
  result.value = null
}
</script>

<style scoped>
.wheel-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 44rpx;
  padding: 44rpx 24rpx 34rpx;
}

.wheel-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 300rpx;
  height: 300rpx;
  border: 18rpx solid #ffb16e;
  border-radius: 50%;
  background: conic-gradient(#ff873d 0 25%, #ffd5a8 25% 50%, #ff9b4d 50% 75%, #ffe7ca 75% 100%);
  box-shadow: 0 18rpx 30rpx rgba(233, 111, 36, 0.16);
}

.wheel-ring--spinning {
  animation: spin-ring 680ms linear infinite;
}

.wheel-core {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 156rpx;
  height: 156rpx;
  border: 10rpx solid #fff4e8;
  border-radius: 50%;
  background: #fff8ef;
  font-size: 54rpx;
}

.wheel-caption {
  max-width: 90%;
  margin-top: 28rpx;
  overflow: hidden;
  color: var(--text);
  font-size: 30rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wheel-count {
  margin-top: 8rpx;
  color: var(--muted);
  font-size: 22rpx;
}

.spin-button {
  width: 100%;
  margin-top: 24rpx;
}

.muted-button {
  width: 100%;
  margin-top: 16rpx;
}

.error-card {
  margin-top: 18rpx;
  padding: 24rpx;
  color: #b84f31;
  font-size: 24rpx;
  line-height: 1.5;
}

.result-card {
  margin-top: 32rpx;
  padding: 30rpx 24rpx;
  text-align: center;
}

.result-kicker,
.result-title,
.result-meta {
  display: block;
}

.result-kicker {
  color: var(--muted);
  font-size: 23rpx;
}

.result-title {
  margin-top: 10rpx;
  color: var(--text);
  font-size: 36rpx;
  font-weight: 800;
}

.result-meta {
  margin-top: 10rpx;
  color: var(--muted);
  font-size: 23rpx;
}

.result-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 24rpx;
}

.action-button {
  flex: 1;
  width: auto;
  margin-top: 0;
  padding: 0;
  font-size: 27rpx;
}

@keyframes spin-ring {
  to { transform: rotate(360deg); }
}
</style>
