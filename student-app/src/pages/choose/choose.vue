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
        <view class="budget-control">
          <button class="budget-step" :disabled="!budget || Number(budget) <= 0" @click="decreaseBudget">−</button>
          <input v-model="budget" class="budget-input" type="number" min="0" step="1" placeholder="不限" confirm-type="search" @input="normalizeBudget" @confirm="search" />
          <text class="budget-unit">元</text>
          <button class="budget-step" @click="increaseBudget">＋</button>
        </view>
        <text class="filter-hint">将比较菜品的最高价格</text>
      </view>

      <view class="filter-section">
        <text class="filter-title">食堂</text>
        <picker :range="cafeterias" range-key="cafeteria_name" @change="onCafeteriaChange">
          <view class="picker-value">{{ cafeteriaLabel }} <text>⌄</text></view>
        </picker>
      </view>

      <view class="filter-section">
        <text class="filter-title">口味</text>
        <view class="chip-list">
          <text class="filter-chip" :class="{ active: !flavor }" @click="flavor = ''">不限</text>
          <text v-for="option in flavorOptions" :key="option" class="filter-chip" :class="{ active: flavor === option }" @click="flavor = option">{{ option }}</text>
        </view>
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
    <DishDetailModal
      :dish="selectedDish"
      :visible="detailVisible"
      secondary-label="关闭"
      @close="closeDish"
      @secondary="closeDish"
      @confirm="confirmDish"
    />
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import DishCard from '../../components/DishCard.vue'
import DishDetailModal from '../../components/DishDetailModal.vue'
import { getCafeterias } from '../../services/api'
import { fetchCandidates } from '../../services/dishService'
import { addHistoryRecord, getTodayStatus } from '../../services/localState'

const flavorOptions = ['清淡', '原味', '微辣', '香辣', '麻辣']
const budget = ref('')
const keyword = ref('')
const flavor = ref('')
const cafeteriaId = ref('')
const cafeterias = ref([])
const results = ref([])
const selectedDish = ref(null)
const detailVisible = ref(false)
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
  selectedDish.value = dish
  detailVisible.value = true
}

function closeDish() {
  detailVisible.value = false
  selectedDish.value = null
}

function confirmDish() {
  if (!selectedDish.value) return
  addHistoryRecord(selectedDish.value)
  closeDish()
  uni.showToast({ title: '已记入饭录', icon: 'success' })
}

function increaseBudget() {
  budget.value = String(Math.max(0, Math.floor(Number(budget.value) || 0) + 1))
}

function decreaseBudget() {
  const next = Math.max(0, Math.floor(Number(budget.value) || 0) - 1)
  budget.value = next ? String(next) : ''
}

function normalizeBudget() {
  if (budget.value === '') return
  const value = Number(budget.value)
  budget.value = Number.isFinite(value) ? String(Math.max(0, Math.floor(value))) : ''
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
.keyword-input,
.budget-control {
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

.budget-control {
  display: flex;
  align-items: center;
  padding: 8rpx 10rpx;
}

.budget-step {
  width: 62rpx;
  height: 58rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 18rpx;
  background: var(--light-orange);
  color: var(--dark-orange);
  font-size: 34rpx;
  line-height: 58rpx;
}

.budget-step[disabled] {
  opacity: 0.45;
}

.budget-input {
  flex: 1;
  min-height: 58rpx;
  margin: 0 8rpx;
  padding: 0 8rpx;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: 26rpx;
  text-align: center;
}

.budget-unit {
  margin-right: 10rpx;
  color: var(--muted);
  font-size: 24rpx;
}

.filter-hint {
  display: block;
  margin-top: 8rpx;
  color: #b49a89;
  font-size: 21rpx;
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
