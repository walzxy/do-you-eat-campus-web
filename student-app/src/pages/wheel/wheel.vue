<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="eyebrow">随机一点</text>
      <text class="page-title">今天交给转盘</text>
      <text class="page-subtitle">先根据今日状态缩小候选范围，再把这一顿交给一点运气。</text>

      <view class="wheel-board soft-card">
        <view class="wheel-stage">
          <text class="wheel-pointer">▼</text>
          <view class="wheel-ring" :style="{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3200ms cubic-bezier(.18,.82,.16,1)' : 'none' }">
            <text v-for="(dish, index) in wheelDishes" :key="dish.dish_id" class="wheel-label" :style="labelStyle(index)">{{ shortTitle(dish) }}</text>
            <view class="wheel-core">🍜</view>
          </view>
        </view>
        <text class="wheel-caption">{{ result?.title || '准备好了吗？' }}</text>
        <text class="wheel-count">{{ loading ? '正在读取菜品…' : `从 ${candidates.length} 道校园美食中，为你挑一道` }}</text>
      </view>

      <view v-if="error" class="error-card soft-card">{{ error }}</view>
      <button class="primary-button spin-button" :disabled="loading || spinning || !wheelDishes.length" @click="spin">
        {{ spinning ? '转呀转…' : '点击开饭' }}
      </button>
      <button class="muted-button" :disabled="loading || spinning" @click="reload">换一组候选</button>

    </view>
    <DishDetailModal
      :dish="result"
      :visible="detailVisible"
      secondary-label="换一个"
      @close="closeResult"
      @secondary="spinAgain"
      @confirm="confirmResult"
    />
  </view>
</template>

<script setup>
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'
import DishDetailModal from '../../components/DishDetailModal.vue'
import { addHistoryRecord, getTodayStatus } from '../../services/localState'
import { fetchCandidates } from '../../services/dishService'

const candidates = ref([])
const wheelDishes = ref([])
const rotation = ref(0)
const result = ref(null)
const detailVisible = ref(false)
const loading = ref(false)
const spinning = ref(false)
const error = ref('')
let spinTimer = null

onLoad(reload)

async function reload() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    candidates.value = await fetchCandidates({ status: getTodayStatus()?.status || 'normal' })
    prepareWheel()
  } catch (requestError) {
    candidates.value = []
    wheelDishes.value = []
    error.value = requestError.message || '菜品读取失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function prepareWheel(excludedId = '') {
  const pool = candidates.value.filter(dish => dish.dish_id !== excludedId)
  const source = pool.length >= 8 ? pool : candidates.value
  const shuffled = [...source]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]]
  }
  wheelDishes.value = shuffled.slice(0, 8)
  rotation.value = 0
}

function shortTitle(dish) {
  const name = dish.title || dish.dish_name || ''
  return name.length > 5 ? `${name.slice(0, 5)}…` : name
}

function labelStyle(index) {
  const angle = (index + 0.5) * 45 - 90
  const radians = angle * Math.PI / 180
  return { left: `${50 + 32 * Math.cos(radians)}%`, top: `${50 + 32 * Math.sin(radians)}%` }
}

function spin() {
  if (spinning.value || !wheelDishes.value.length) return
  const previousResultId = result.value?.dish_id
  spinning.value = true
  result.value = null
  const possibleIndexes = wheelDishes.value.map((_, index) => index).filter(index => wheelDishes.value[index].dish_id !== previousResultId)
  const indexes = possibleIndexes.length ? possibleIndexes : wheelDishes.value.map((_, index) => index)
  const selectedIndex = indexes[Math.floor(Math.random() * indexes.length)]
  const sectorCenter = (selectedIndex + 0.5) * 45
  const currentAngle = ((rotation.value % 360) + 360) % 360
  const delta = (360 - sectorCenter - currentAngle + 360) % 360
  rotation.value += 360 * 5 + delta
  spinTimer = setTimeout(() => {
    result.value = wheelDishes.value[selectedIndex]
    spinning.value = false
    detailVisible.value = true
    spinTimer = null
  }, 3250)
}

onUnload(() => { if (spinTimer) clearTimeout(spinTimer) })

function confirmResult() {
  if (!result.value) return
  addHistoryRecord(result.value)
  detailVisible.value = false
  uni.showToast({ title: '已记入饭录', icon: 'success' })
}

function closeResult() {
  detailVisible.value = false
}

function spinAgain() {
  detailVisible.value = false
  spin()
}
</script>

<style scoped>
.wheel-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30rpx;
  padding: 30rpx 12rpx 28rpx;
}

.wheel-stage { position: relative; width: 520rpx; height: 520rpx; max-width: 100%; }
.wheel-pointer { position: absolute; z-index: 2; top: -16rpx; left: 50%; transform: translateX(-50%); color: var(--dark-orange); font-size: 58rpx; }
.wheel-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 12rpx solid #ffb16e;
  border-radius: 50%;
  background: repeating-conic-gradient(from 0deg, #ffe3bc 0deg 44deg, #fff2df 44deg 45deg, #ffb879 45deg 89deg, #fff2df 89deg 90deg);
  box-shadow: 0 18rpx 30rpx rgba(233, 111, 36, 0.16);
}

.wheel-label { position: absolute; width: 100rpx; transform: translate(-50%, -50%); color: #6a3b21; font-size: 20rpx; font-weight: 750; line-height: 1.25; text-align: center; }

.wheel-core {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100rpx;
  height: 100rpx;
  border: 10rpx solid #fff4e8;
  border-radius: 50%;
  background: #fff8ef;
  font-size: 46rpx;
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

</style>
