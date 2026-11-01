<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="eyebrow">按你的想法</text>
      <text class="page-title">选一选</text>
      <text class="page-subtitle">把现在在意的条件告诉我，结果会直接来自菜品数据。</text>

      <view class="filter-section">
        <text class="filter-title">想吃什么</text>
        <input v-model="keyword" class="keyword-input" placeholder="输入菜名或关键词，例如：鸡蛋、面、盖饭" confirm-type="search" @confirm="search" />
        <view class="chip-list compact-chips">
          <text v-for="word in keywordOptions" :key="word" class="filter-chip" :class="{ active: keyword === word }" @click="keyword = keyword === word ? '' : word">{{ word }}</text>
        </view>
      </view>

      <view class="filter-section">
        <text class="filter-title">预算上限</text>
        <view class="chip-list">
          <text v-for="option in budgetOptions" :key="option.label" class="filter-chip" :class="{ active: !customBudget && budget === option.value }" @click="selectBudget(option.value)">{{ option.label }}</text>
        </view>
        <input v-if="customBudget" v-model="budget" class="custom-budget" type="number" placeholder="输入自定义预算上限（元）" @input="normalizeBudget" />
        <text v-else class="custom-budget-link" @click="customBudget = true; budget = ''">自定义金额 ›</text>
        <text class="filter-hint">按菜品最高价格筛选</text>
      </view>

      <view class="filter-section">
        <text class="filter-title">食堂</text>
        <scroll-view scroll-x="true" class="cafeteria-scroll">
          <view class="cafeteria-list">
            <text class="filter-chip" :class="{ active: !cafeteriaId }" @click="cafeteriaId = ''">全部</text>
            <text v-for="item in cafeterias" :key="item.cafeteria_id" class="filter-chip" :class="{ active: cafeteriaId === item.cafeteria_id }" @click="cafeteriaId = item.cafeteria_id">{{ item.cafeteria_name }}</text>
          </view>
        </scroll-view>
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
import { ref } from 'vue'
import DishCard from '../../components/DishCard.vue'
import DishDetailModal from '../../components/DishDetailModal.vue'
import { getCafeterias } from '../../services/api'
import { fetchCandidates } from '../../services/dishService'
import { addHistoryRecord, getTodayStatus } from '../../services/localState'

const flavorOptions = ['清淡', '原味', '微辣', '香辣', '麻辣']
const keywordOptions = ['鸡', '面', '盖饭', '汤']
const budgetOptions = [
  { label: '不限', value: '' },
  { label: '10 元内', value: '10' },
  { label: '15 元内', value: '15' },
  { label: '20 元内', value: '20' }
]
const budget = ref('')
const customBudget = ref(false)
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
onLoad(async (query = {}) => {
  keyword.value = query.keyword || ''
  budget.value = query.budget || ''
  customBudget.value = budget.value !== '' && !budgetOptions.some(option => option.value === budget.value)
  flavor.value = query.flavor || ''
  cafeteriaId.value = query.cafeteriaId || ''
  try {
    cafeterias.value = await getCafeterias()
  } catch {
    cafeterias.value = []
  }
  if (query.auto === '1') await search()
})

async function search() {
  if (customBudget.value && !budget.value) {
    error.value = '请填写自定义预算金额'
    return
  }
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

function selectBudget(value) {
  budget.value = value
  customBudget.value = false
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

function normalizeBudget() {
  if (budget.value === '') return
  const value = Number(budget.value)
  budget.value = Number.isFinite(value) ? String(Math.max(0, Math.floor(value))) : ''
}
</script>

<style scoped>
.filter-section { margin-top: 24rpx; }

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

.keyword-input,
.custom-budget {
  box-sizing: border-box;
  width: 100%;
  min-height: 78rpx;
  margin-top: 12rpx;
  padding: 20rpx 22rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  color: var(--muted);
  font-size: 25rpx;
}

.custom-budget-link { display: block; margin-top: 14rpx; color: var(--dark-orange); font-size: 23rpx; }
.cafeteria-scroll { width: 100%; margin-top: 14rpx; white-space: nowrap; }
.cafeteria-list { display: inline-flex; gap: 12rpx; padding-bottom: 5rpx; }
.compact-chips { margin-top: 10rpx; }

.filter-hint {
  display: block;
  margin-top: 8rpx;
  color: #b49a89;
  font-size: 21rpx;
}

.search-button {
  width: 100%;
  margin-top: 26rpx;
}

.result-heading {
  margin: 32rpx 0 22rpx;
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
