<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="eyebrow">按你的想法</text>
      <text class="page-title">选一选</text>
      <text class="page-subtitle">把现在在意的条件告诉我，结果会直接来自菜品数据。</text>

      <view class="filter-section">
        <text class="filter-title">想吃什么</text>
        <input v-model="keyword" class="keyword-input" placeholder="输入菜名或关键词，例如：鸡蛋、面、盖饭" confirm-type="search" @confirm="search" />
      </view>

      <view class="filter-section">
        <text class="filter-title">预算上限</text>
        <view class="chip-list">
          <text v-for="value in budgets" :key="value" class="filter-chip" :class="{ active: budget === value }" @click="budget = value">{{ value }} 元</text>
        </view>
      </view>

      <view class="filter-section">
        <text class="filter-title">食堂</text>
        <picker :range="cafeterias" range-key="cafeteria_name" @change="onCafeteriaChange">
          <view class="picker-value">{{ cafeteriaLabel }} <text>⌄</text></view>
        </picker>
      </view>

      <view class="filter-section">
        <text class="filter-title">吃饭方式</text>
        <view class="chip-list">
          <text v-for="option in packableOptions" :key="option.value" class="filter-chip" :class="{ active: isPackable === option.value }" @click="isPackable = option.value">{{ option.label }}</text>
        </view>
      </view>

      <view class="filter-section">
        <text class="filter-title">口味关键词</text>
        <input v-model="flavor" class="flavor-input" placeholder="例如：清淡、辣、甜" confirm-type="search" @confirm="search" />
      </view>

      <button class="primary-button search-button" :disabled="loading" @click="search">{{ loading ? '查找中…' : '开始筛选' }}</button>

      <view class="result-heading">
        <text class="section-title">匹配结果</text>
        <text class="section-caption">{{ results.length ? `找到 ${results.length} 道可选菜品` : '还没有开始筛选' }}</text>
      </view>
      <view v-if="error" class="error-card soft-card">{{ error }}</view>
      <view v-if="!loading && !error && searched && !results.length" class="empty-card soft-card">没有匹配到菜品，可以放宽一个条件再试试。</view>
      <DishCard v-if="!loading && !error && searched && results.length" v-for="dish in results" :key="dish.dish_id" :dish="dish" @open="openDish" />
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import DishCard from '../../components/DishCard.vue'
import { getCafeterias } from '../../services/api'
import { fetchCandidates } from '../../services/dishService'
import { getTodayStatus } from '../../services/localState'

const budgets = [6, 8, 10, 12, 14, 16, 20]
const packableOptions = [
  { value: '', label: '均可' },
  { value: '是', label: '打包' },
  { value: '否', label: '堂食' }
]
const budget = ref('')
const keyword = ref('')
const flavor = ref('')
const isPackable = ref('')
const cafeteriaId = ref('')
const cafeterias = ref([])
const results = ref([])
const loading = ref(false)
const searched = ref(false)
const error = ref('')
const cafeteriaLabel = computed(() => cafeterias.value.find((item) => item.cafeteria_id === cafeteriaId.value)?.cafeteria_name || '全部食堂')

onLoad(async () => {
  try {
    cafeterias.value = await getCafeterias()
  } catch {
    cafeterias.value = []
  }
})

function onCafeteriaChange(event) {
  cafeteriaId.value = cafeterias.value[Number(event.detail.value)]?.cafeteria_id || ''
}

async function search() {
  loading.value = true
  searched.value = true
  error.value = ''
  try {
    results.value = await fetchCandidates({
      status: getTodayStatus()?.status || 'normal',
      keyword: keyword.value.trim(),
      budget: budget.value,
      flavor: flavor.value.trim(),
      isPackable: isPackable.value,
      cafeteriaId: cafeteriaId.value
    })
  } catch (requestError) {
    results.value = []
    error.value = requestError.message || '检索失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function openDish(dish) {
  uni.navigateTo({ url: `/pages/dish-detail/dish-detail?dishId=${encodeURIComponent(dish.dish_id)}` })
}
</script>

<style scoped>
.filter-section {
  margin-top: 34rpx;
}

.filter-title {
  display: block;
  color: var(--text);
  font-size: 28rpx;
  font-weight: 800;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 16rpx;
}

.filter-chip {
  padding: 14rpx 22rpx;
  border: 2rpx solid var(--border);
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.72);
  color: var(--muted);
  font-size: 24rpx;
}

.filter-chip.active {
  border-color: var(--main);
  background: var(--light-orange);
  color: var(--dark-orange);
  font-weight: 700;
}

.picker-value,
.flavor-input,
.keyword-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 78rpx;
  margin-top: 16rpx;
  padding: 20rpx 22rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  color: var(--muted);
  font-size: 25rpx;
}

.picker-value {
  display: flex;
  justify-content: space-between;
}

.search-button {
  width: 100%;
  margin-top: 40rpx;
}

.result-heading {
  margin: 52rpx 0 22rpx;
}

.empty-card,
.error-card {
  padding: 30rpx 24rpx;
  color: var(--muted);
  font-size: 25rpx;
  text-align: center;
}

.error-card {
  color: #b84f31;
}
</style>
