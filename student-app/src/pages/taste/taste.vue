<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="page-title">口味画像</text>
      <text class="page-subtitle">选择喜欢的口味，记录想避开的食材。</text>
      <view class="taste-card soft-card">
        <text class="section-title">喜欢的口味</text>
        <view class="chips">
          <text v-for="item in flavorOptions" :key="item" class="chip" :class="{ active: flavors.includes(item) }" @click="toggle(flavors, item)">{{ item }}</text>
        </view>
        <text class="section-title second-title">忌口</text>
        <view class="chips">
          <text v-for="item in avoidOptions" :key="item" class="chip" :class="{ active: avoid.includes(item) }" @click="toggle(avoid, item)">{{ item }}</text>
        </view>
        <input v-model="otherAvoid" class="other-input" placeholder="其他忌口，可用顿号分隔" />
        <text class="note">菜品原料信息尚不完整，忌口仅作为偏好记录，点餐前请向窗口确认。</text>
        <button class="primary-button save-button" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存口味画像' }}</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { ensureAccountSession, getAccount, updateTaste } from '../../services/api'

const flavorOptions = ['清淡', '原味', '微辣', '香辣', '麻辣']
const avoidOptions = ['香菜', '花生', '葱', '蒜', '辣椒']
const flavors = ref([])
const avoid = ref([])
const otherAvoid = ref('')
const saving = ref(false)

onLoad(async () => {
  try {
    await ensureAccountSession()
    const profile = await getAccount()
    flavors.value = [...(profile.taste?.flavors || [])]
    const saved = profile.taste?.avoid || []
    avoid.value = saved.filter(item => avoidOptions.includes(item))
    otherAvoid.value = saved.filter(item => !avoidOptions.includes(item)).join('、')
  } catch (error) {
    uni.showToast({ title: error.message || '读取失败', icon: 'none' })
  }
})

function toggle(list, item) {
  const index = list.value.indexOf(item)
  if (index === -1) list.value.push(item)
  else list.value.splice(index, 1)
}

async function save() {
  const extras = otherAvoid.value.split(/[、,，]/).map(item => item.trim()).filter(Boolean)
  const items = [...new Set([...avoid.value, ...extras])]
  if (items.length > 10 || items.some(item => item.length > 30)) {
    uni.showToast({ title: '忌口最多 10 项，每项不超过 30 字', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await updateTaste({ flavors: flavors.value, avoid: items })
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.taste-card { margin-top: 26rpx; padding: 24rpx; background: #fffdf9; }
.second-title { display: block; margin-top: 34rpx; }
.chips { display: flex; flex-wrap: wrap; gap: 14rpx; margin-top: 18rpx; }
.chip { padding: 12rpx 20rpx; border: 2rpx solid var(--border); border-radius: 20rpx; background: #fffdf9; color: var(--muted); font-size: 23rpx; transition: background 160ms ease, border-color 160ms ease, transform 160ms ease; }
.chip:active { transform: scale(0.97); }
.chip.active { border-color: var(--main); background: var(--light-orange); color: var(--dark-orange); font-weight: 700; }
.other-input { box-sizing: border-box; width: 100%; height: 72rpx; margin-top: 20rpx; padding: 0 18rpx; border: 2rpx solid var(--border); border-radius: 18rpx; background: #fffdf9; font-size: 23rpx; }
.note { display: block; margin-top: 16rpx; color: var(--muted); font-size: 21rpx; line-height: 1.5; }
.save-button { margin-top: 28rpx; width: 100%; }
</style>
