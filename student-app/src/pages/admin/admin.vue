<template>
  <view class="admin-page">
    <view class="admin-topbar">
      <view>
        <text class="admin-kicker">今天吃了么</text>
        <text class="admin-title">管理模式</text>
      </view>
      <button class="logout-button" @click="logout">退出</button>
    </view>

    <view class="admin-tabs">
      <text v-for="item in tabs" :key="item.value" class="admin-tab" :class="{ active: tab === item.value }" @click="tab = item.value">{{ item.label }}</text>
    </view>

    <view v-if="tab === 'dishes'" class="admin-section">
      <view class="admin-toolbar">
        <input v-model="keyword" class="admin-search" placeholder="检索菜品名称或关键词" confirm-type="search" @confirm="loadDishes" />
        <button class="small-button" @click="loadDishes">检索</button>
      </view>
      <scroll-view class="cafeteria-filter" scroll-x="true" :show-scrollbar="false">
        <view class="cafeteria-filter-inner">
          <text class="cafeteria-chip" :class="{ active: !selectedCafeteriaId }" @click="selectCafeteria('')">全部食堂</text>
          <text
            v-for="cafeteria in cafeterias"
            :key="cafeteria.cafeteria_id"
            class="cafeteria-chip"
            :class="{ active: selectedCafeteriaId === cafeteria.cafeteria_id }"
            @click="selectCafeteria(cafeteria.cafeteria_id)"
          >{{ cafeteria.cafeteria_name }}</text>
        </view>
      </scroll-view>
      <text v-if="dishError" class="admin-error">{{ dishError }}</text>
      <text v-if="loadingDishes" class="admin-empty">读取中…</text>
      <text v-else-if="!filteredDishes.length" class="admin-empty">暂无匹配菜品</text>
      <view v-for="dish in filteredDishes" :key="dish.dish_id" class="admin-dish soft-card">
        <view class="admin-dish-copy">
          <text class="admin-dish-name">{{ dish.dish_name }}</text>
          <text class="admin-dish-meta">{{ dish.price_min }}–{{ dish.price_max }} 元 · {{ dish.cafeteria_name || dish.cafeteria_id }}</text>
          <text class="admin-dish-meta">{{ dish.category_major || '未分类' }} · {{ dish.availability_status || '未标注' }}</text>
        </view>
        <view class="dish-actions">
          <button class="edit-button" @click="openDishEditor(dish)">编辑详情</button>
          <button class="status-button" @click="toggleDish(dish)">{{ dish.availability_status === '暂时未售卖' ? '恢复' : '下架' }}</button>
        </view>
      </view>
    </view>

    <view v-else-if="tab === 'import'" class="admin-section">
      <text class="section-title">数据处理</text>
      <text class="section-caption">先预览 Excel 的解析与校验结果，确认后才发布，不直接覆盖线上数据。</text>
      <view class="import-card soft-card">
        <input class="file-input" type="file" accept=".xlsx,.xls" @change="selectFile" />
        <text class="file-name">{{ fileName || '选择 Excel 文件' }}</text>
        <button class="small-button" :disabled="!selectedFile || importing" @click="previewImport">{{ importing ? '解析中…' : '预览数据' }}</button>
      </view>
      <view v-if="preview" class="preview-card soft-card">
        <text class="preview-title">预览结果</text>
        <text class="preview-line">食堂：{{ preview.summary?.cafeterias ?? preview.cafeterias?.length ?? 0 }}</text>
        <text class="preview-line">窗口：{{ preview.summary?.windows ?? preview.windows?.length ?? 0 }}</text>
        <text class="preview-line">菜品：{{ preview.summary?.dishes ?? preview.dishes?.length ?? 0 }}</text>
        <text class="preview-line">拒绝行：{{ preview.rejected?.length ?? 0 }}</text>
        <input v-model="importReason" class="reason-input" placeholder="发布原因（必填）" />
        <button class="primary-button confirm-import" :disabled="confirming || !importReason.trim()" @click="confirmImport">{{ confirming ? '发布中…' : '确认发布' }}</button>
      </view>
      <text v-if="importMessage" class="success-message">{{ importMessage }}</text>
      <text v-if="importError" class="admin-error">{{ importError }}</text>
    </view>

    <view v-else class="admin-section">
      <text class="section-title">版本与变更</text>
      <text class="section-caption">查看当前数据版本和最近的管理员操作记录。</text>
      <view v-if="versionInfo" class="info-card soft-card">
        <text>当前版本：{{ versionInfo.current?.version_id || '无' }}</text>
        <text>上一版本：{{ versionInfo.previous?.version_id || '无' }}</text>
        <text>历史版本：{{ versionInfo.total_versions || 0 }}</text>
      </view>
      <view class="changelog-card soft-card">
        <text class="preview-title">最近变更</text>
        <text v-if="!changeLog.length" class="admin-empty">暂无记录</text>
        <view v-for="entry in changeLog.slice(0, 12)" :key="entry.change_id" class="change-row">
          <text>{{ entry.action }} · {{ entry.target_id }}</text>
          <text>{{ entry.reason || '未填写原因' }}</text>
        </view>
      </view>
    </view>

    <view v-if="editorVisible" class="modal-mask" @click="closeDishEditor">
      <view class="editor-modal" @click.stop>
        <view class="editor-header">
          <view>
            <text class="editor-kicker">编辑菜品信息</text>
            <text class="editor-title">{{ editingDish?.dish_name || '菜品详情' }}</text>
          </view>
          <text class="editor-close" @click="closeDishEditor">×</text>
        </view>

        <view class="editor-field">
          <text class="editor-label">关键词</text>
          <input v-model="editForm.keywords" class="editor-input" placeholder="例如：早餐、盖饭" />
        </view>
        <view class="editor-row">
          <view class="editor-field editor-half">
            <text class="editor-label">最低价</text>
            <input v-model="editForm.price_min" class="editor-input" type="digit" />
          </view>
          <view class="editor-field editor-half">
            <text class="editor-label">最高价</text>
            <input v-model="editForm.price_max" class="editor-input" type="digit" />
          </view>
        </view>
        <view class="editor-field">
          <text class="editor-label">口味</text>
          <input v-model="editForm.flavor" class="editor-input" placeholder="例如：清淡、微辣、酸甜" />
        </view>
        <view class="editor-field">
          <text class="editor-label">是否支持打包</text>
          <picker :range="packableOptions" :value="packableIndex" @change="onPackableChange">
            <view class="editor-picker">{{ editForm.is_packable || '未知' }} <text>⌄</text></view>
          </picker>
        </view>
        <view class="editor-row">
          <view class="editor-field editor-half">
            <text class="editor-label">大类</text>
            <input v-model="editForm.category_major" class="editor-input" placeholder="例如：主食" />
          </view>
          <view class="editor-field editor-half">
            <text class="editor-label">小类</text>
            <input v-model="editForm.category_minor" class="editor-input" placeholder="例如：盖饭" />
          </view>
        </view>
        <view class="editor-field">
          <text class="editor-label">修改原因（可选）</text>
          <input v-model="editForm.reason" class="editor-input" placeholder="例如：根据今日窗口确认结果修正" />
        </view>
        <text v-if="editorError" class="editor-error">{{ editorError }}</text>
        <view class="editor-actions">
          <button class="editor-cancel" @click="closeDishEditor">取消</button>
          <button class="editor-save" :disabled="savingDish" @click="saveDishEdit">{{ savingDish ? '保存中…' : '保存修改' }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import {
  adminConfirmImport,
  adminGetChangeLog,
  getCafeterias,
  adminGetVersions,
  adminListDishes,
  adminPreviewImport,
  adminUpdateDish,
  adminToggleDishStatus,
  adminVerify,
  clearAdminToken,
  hasAdminToken
} from '../../services/api'

const tabs = [
  { value: 'dishes', label: '菜品检索' },
  { value: 'import', label: '数据处理' },
  { value: 'system', label: '版本记录' }
]
const tab = ref('dishes')
const keyword = ref('')
const dishes = ref([])
const cafeterias = ref([])
const selectedCafeteriaId = ref('')
const loadingDishes = ref(false)
const dishError = ref('')
const selectedFile = ref(null)
const fileName = ref('')
const preview = ref(null)
const importing = ref(false)
const confirming = ref(false)
const importReason = ref('')
const importMessage = ref('')
const importError = ref('')
const versionInfo = ref(null)
const changeLog = ref([])
const editorVisible = ref(false)
const editingDish = ref(null)
const savingDish = ref(false)
const editorError = ref('')
const packableOptions = ['未知', '是', '否']
const editForm = ref(createEmptyEditForm())

const filteredDishes = computed(() => {
  if (!selectedCafeteriaId.value) return dishes.value
  return dishes.value.filter(dish => dish.cafeteria_id === selectedCafeteriaId.value)
})

function createEmptyEditForm() {
  return {
    keywords: '',
    price_min: '',
    price_max: '',
    flavor: '',
    is_packable: '未知',
    category_major: '',
    category_minor: '',
    reason: ''
  }
}

const packableIndex = computed(() => Math.max(0, packableOptions.indexOf(editForm.value.is_packable)))

onLoad(async () => {
  if (!hasAdminToken()) {
    uni.redirectTo({ url: '/pages/admin-login/admin-login' })
    return
  }
  try {
    await adminVerify()
    await Promise.all([loadDishes(), loadSystem(), loadCafeterias()])
  } catch (error) {
    clearAdminToken()
    uni.redirectTo({ url: '/pages/admin-login/admin-login' })
  }
})

async function loadDishes() {
  loadingDishes.value = true
  dishError.value = ''
  try {
    dishes.value = await adminListDishes(keyword.value.trim())
  } catch (error) {
    dishes.value = []
    dishError.value = error.message || '菜品检索失败'
  } finally {
    loadingDishes.value = false
  }
}

async function loadCafeterias() {
  try {
    cafeterias.value = await getCafeterias()
  } catch {
    cafeterias.value = []
  }
}

function selectCafeteria(cafeteriaId) {
  selectedCafeteriaId.value = cafeteriaId
}

async function loadSystem() {
  try {
    versionInfo.value = await adminGetVersions()
    const log = await adminGetChangeLog()
    changeLog.value = log.items || []
  } catch {
    versionInfo.value = null
    changeLog.value = []
  }
}

async function toggleDish(dish) {
  const nextStatus = dish.availability_status === '暂时未售卖' ? '已核实售卖' : '暂时未售卖'
  try {
    await adminToggleDishStatus(dish.dish_id, nextStatus, `管理端${nextStatus === '暂时未售卖' ? '下架' : '恢复'}`)
    dish.availability_status = nextStatus
  } catch (error) {
    uni.showToast({ title: error.message || '操作失败', icon: 'none' })
  }
}

function openDishEditor(dish) {
  editingDish.value = dish
  editorError.value = ''
  editForm.value = {
    keywords: dish.keywords || '',
    price_min: dish.price_min ?? '',
    price_max: dish.price_max ?? '',
    flavor: dish.flavor || '',
    is_packable: dish.is_packable || '未知',
    category_major: dish.category_major || '',
    category_minor: dish.category_minor || '',
    reason: ''
  }
  editorVisible.value = true
}

function closeDishEditor() {
  if (savingDish.value) return
  editorVisible.value = false
  editingDish.value = null
  editorError.value = ''
}

function onPackableChange(event) {
  editForm.value.is_packable = packableOptions[Number(event.detail.value)] || '未知'
}

async function saveDishEdit() {
  if (!editingDish.value) return
  const priceMin = Number(editForm.value.price_min)
  const priceMax = Number(editForm.value.price_max)
  if (Number.isNaN(priceMin) || Number.isNaN(priceMax) || priceMin < 0 || priceMax < 0) {
    editorError.value = '价格必须是非负数字'
    return
  }
  if (priceMin > priceMax) {
    editorError.value = '最低价不能高于最高价'
    return
  }

  savingDish.value = true
  editorError.value = ''
  try {
    await adminUpdateDish(editingDish.value.dish_id, {
      keywords: editForm.value.keywords.trim(),
      price_min: priceMin,
      price_max: priceMax,
      flavor: editForm.value.flavor.trim(),
      is_packable: editForm.value.is_packable,
      category_major: editForm.value.category_major.trim(),
      category_minor: editForm.value.category_minor.trim(),
      reason: editForm.value.reason.trim() || '管理端编辑菜品详情'
    })
    Object.assign(editingDish.value, {
      keywords: editForm.value.keywords.trim(),
      price_min: priceMin,
      price_max: priceMax,
      flavor: editForm.value.flavor.trim(),
      is_packable: editForm.value.is_packable,
      category_major: editForm.value.category_major.trim(),
      category_minor: editForm.value.category_minor.trim()
    })
    savingDish.value = false
    closeDishEditor()
    uni.showToast({ title: '详情已保存', icon: 'success' })
    await loadSystem()
  } catch (error) {
    editorError.value = error.message || '保存失败，请稍后重试'
  } finally {
    savingDish.value = false
  }
}

function selectFile(event) {
  selectedFile.value = event.target?.files?.[0] || null
  fileName.value = selectedFile.value?.name || ''
  preview.value = null
  importMessage.value = ''
  importError.value = ''
}

async function previewImport() {
  if (!selectedFile.value) return
  importing.value = true
  importError.value = ''
  try {
    preview.value = await adminPreviewImport(selectedFile.value)
  } catch (error) {
    importError.value = error.message || 'Excel 预览失败'
  } finally {
    importing.value = false
  }
}

async function confirmImport() {
  if (!preview.value || !importReason.value.trim()) return
  confirming.value = true
  importError.value = ''
  try {
    await adminConfirmImport(preview.value, importReason.value.trim())
    importMessage.value = '数据已发布，版本记录已更新。'
    await Promise.all([loadDishes(), loadSystem()])
  } catch (error) {
    importError.value = error.message || '数据发布失败'
  } finally {
    confirming.value = false
  }
}

function logout() {
  clearAdminToken()
  uni.redirectTo({ url: '/pages/admin-login/admin-login' })
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 34rpx 28rpx calc(60rpx + env(safe-area-inset-bottom));
  background: var(--bg);
}

.admin-topbar,
.admin-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.admin-kicker,
.admin-title,
.section-title,
.section-caption {
  display: block;
}

.admin-kicker {
  color: var(--main);
  font-size: 23rpx;
  font-weight: 700;
}

.admin-title {
  margin-top: 6rpx;
  color: var(--text);
  font-size: 38rpx;
  font-weight: 800;
}

.logout-button,
.small-button,
.status-button {
  margin: 0;
  border-radius: 26rpx;
  font-size: 22rpx;
}

.logout-button,
.small-button {
  padding: 12rpx 20rpx;
  border: 2rpx solid var(--border);
  background: #fff;
  color: var(--dark-orange);
}

.admin-tabs {
  display: flex;
  gap: 12rpx;
  margin-top: 34rpx;
  padding: 8rpx;
  border-radius: 32rpx;
  background: #ffeada;
}

.admin-tab {
  flex: 1;
  padding: 16rpx 8rpx;
  border-radius: 26rpx;
  color: var(--muted);
  font-size: 23rpx;
  text-align: center;
}

.admin-tab.active {
  background: #fff;
  color: var(--dark-orange);
  font-weight: 750;
}

.admin-section {
  margin-top: 34rpx;
}

.section-title {
  color: var(--text);
  font-size: 32rpx;
  font-weight: 800;
}

.section-caption {
  margin-top: 10rpx;
  color: var(--muted);
  font-size: 23rpx;
  line-height: 1.55;
}

.admin-search,
.reason-input {
  flex: 1;
  height: 74rpx;
  box-sizing: border-box;
  padding: 0 20rpx;
  border: 2rpx solid var(--border);
  border-radius: 22rpx;
  background: #fff;
  color: var(--text);
  font-size: 24rpx;
}

.cafeteria-filter {
  width: 100%;
  margin-top: 18rpx;
  white-space: nowrap;
}

.cafeteria-filter-inner {
  display: inline-flex;
  gap: 12rpx;
  padding-bottom: 4rpx;
}

.cafeteria-chip {
  display: inline-block;
  padding: 12rpx 20rpx;
  border: 2rpx solid var(--border);
  border-radius: 28rpx;
  background: #fff;
  color: var(--muted);
  font-size: 22rpx;
}

.cafeteria-chip.active {
  border-color: var(--main);
  background: var(--light-orange);
  color: var(--dark-orange);
  font-weight: 750;
}

.admin-dish {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 16rpx;
  padding: 20rpx;
}

.dish-actions {
  display: flex;
  flex-shrink: 0;
  gap: 10rpx;
}

.admin-dish-copy {
  flex: 1;
  min-width: 0;
}

.admin-dish-name,
.admin-dish-meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-dish-name {
  color: var(--text);
  font-size: 27rpx;
  font-weight: 750;
}

.admin-dish-meta {
  margin-top: 7rpx;
  color: var(--muted);
  font-size: 21rpx;
}

.status-button {
  padding: 12rpx 18rpx;
  border: 2rpx solid #f1c7ac;
  background: #fff8ef;
  color: var(--dark-orange);
}

.edit-button {
  margin: 0;
  padding: 12rpx 18rpx;
  border: 2rpx solid #f2d7be;
  border-radius: 26rpx;
  background: #fff;
  color: var(--text);
  font-size: 22rpx;
}

.admin-empty,
.admin-error,
.success-message {
  display: block;
  margin-top: 24rpx;
  font-size: 23rpx;
  text-align: center;
}

.admin-empty {
  color: var(--muted);
}

.admin-error {
  color: #b84f31;
}

.success-message {
  color: #49845e;
}

.import-card,
.preview-card,
.info-card,
.changelog-card {
  margin-top: 22rpx;
  padding: 24rpx;
}

.file-input {
  width: 100%;
  font-size: 23rpx;
}

.file-name {
  display: block;
  margin-top: 14rpx;
  color: var(--muted);
  font-size: 22rpx;
}

.import-card .small-button {
  margin-top: 18rpx;
}

.preview-title {
  display: block;
  color: var(--text);
  font-size: 27rpx;
  font-weight: 800;
}

.preview-line,
.info-card text {
  display: block;
  margin-top: 12rpx;
  color: var(--muted);
  font-size: 23rpx;
}

.reason-input {
  display: block;
  width: 100%;
  margin-top: 20rpx;
}

.confirm-import {
  width: 100%;
  margin-top: 18rpx;
}

.change-row {
  padding: 18rpx 0;
  border-bottom: 2rpx solid rgba(242, 215, 190, 0.6);
  color: var(--muted);
  font-size: 22rpx;
}

.change-row text {
  display: block;
}

.change-row text + text {
  margin-top: 6rpx;
  color: #b49a89;
}

.modal-mask {
  position: fixed;
  z-index: 20;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(49, 32, 22, 0.38);
}

.editor-modal {
  width: 100%;
  box-sizing: border-box;
  max-height: 88vh;
  overflow-y: auto;
  padding: 30rpx 28rpx calc(34rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx 34rpx 0 0;
  background: #fffaf5;
}

.editor-header,
.editor-actions,
.editor-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.editor-header,
.editor-actions {
  justify-content: space-between;
}

.editor-kicker,
.editor-title,
.editor-label {
  display: block;
}

.editor-kicker {
  color: var(--main);
  font-size: 22rpx;
  font-weight: 700;
}

.editor-title {
  margin-top: 6rpx;
  color: var(--text);
  font-size: 34rpx;
  font-weight: 800;
}

.editor-close {
  padding: 0 10rpx;
  color: var(--muted);
  font-size: 46rpx;
  line-height: 1;
}

.editor-field {
  flex: 1;
  min-width: 0;
  margin-top: 22rpx;
}

.editor-label {
  margin-bottom: 9rpx;
  color: var(--text);
  font-size: 23rpx;
  font-weight: 700;
}

.editor-input,
.editor-picker {
  width: 100%;
  height: 72rpx;
  box-sizing: border-box;
  padding: 0 18rpx;
  border: 2rpx solid var(--border);
  border-radius: 18rpx;
  background: #fff;
  color: var(--text);
  font-size: 23rpx;
  line-height: 72rpx;
}

.editor-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-half {
  width: 50%;
}

.editor-error {
  display: block;
  margin-top: 18rpx;
  color: #b84f31;
  font-size: 22rpx;
}

.editor-actions {
  margin-top: 28rpx;
}

.editor-cancel,
.editor-save {
  flex: 1;
  margin: 0;
  border-radius: 22rpx;
  font-size: 24rpx;
}

.editor-cancel {
  border: 2rpx solid var(--border);
  background: #fff;
  color: var(--muted);
}

.editor-save {
  border: 2rpx solid var(--dark-orange);
  background: var(--dark-orange);
  color: #fff;
}
</style>
