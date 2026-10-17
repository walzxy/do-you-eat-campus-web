<template>
  <view v-if="visible && dish" class="modal-mask" @click.self="$emit('close')">
    <view class="dish-modal">
      <view class="modal-topbar">
        <text class="modal-kicker">菜品详情</text>
        <text class="modal-close" @click="$emit('close')">×</text>
      </view>

      <view class="modal-dish-head">
        <view class="modal-dish-art">🍜</view>
        <view class="modal-dish-copy">
          <text class="modal-title">{{ dish.title || dish.dish_name || dish.name }}</text>
          <text class="modal-meta">{{ dish.priceText || formatPrice(dish) }}</text>
          <text class="modal-location">{{ dish.locationText || locationText(dish) }}</text>
        </view>
      </view>

      <view class="modal-tags">
        <text v-if="dish.category_major" class="modal-tag">{{ dish.category_major }}</text>
        <text v-if="dish.category_minor" class="modal-tag">{{ dish.category_minor }}</text>
        <text v-if="dish.flavor && dish.flavor !== '未知'" class="modal-tag">{{ dish.flavor }}</text>
      </view>

      <view class="modal-info-list">
        <view class="modal-info-row">
          <text>位置</text>
          <text>{{ dish.locationText || locationText(dish) }}</text>
        </view>
        <view class="modal-info-row">
          <text>打包</text>
          <text>{{ dish.is_packable || '未知' }}</text>
        </view>
      </view>

      <view class="modal-actions">
        <button class="modal-secondary" @click="$emit('secondary')">{{ secondaryLabel }}</button>
        <button class="modal-primary" @click="$emit('confirm')">{{ confirmLabel }}</button>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  dish: { type: Object, default: null },
  visible: { type: Boolean, default: false },
  confirmLabel: { type: String, default: '就这个' },
  secondaryLabel: { type: String, default: '关闭' }
})

defineEmits(['close', 'confirm', 'secondary'])

function formatPrice(dish) {
  const min = dish?.price_min
  const max = dish?.price_max ?? min
  if (min === null || min === undefined || min === '') return '价格待补充'
  if (max === min || max === null || max === undefined || max === '') return `${min} 元`
  return `${min}–${max} 元`
}

function locationText(dish) {
  return [dish?.cafeteria_name, dish?.window_name].filter(Boolean).join(' · ') || '位置待补充'
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 30;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(49, 32, 22, 0.4);
}

.dish-modal {
  width: 100%;
  box-sizing: border-box;
  max-height: 84vh;
  overflow-y: auto;
  padding: 28rpx 28rpx calc(32rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx 34rpx 0 0;
  background: #fffaf5;
}

.modal-topbar,
.modal-dish-head,
.modal-actions,
.modal-info-row {
  display: flex;
  align-items: center;
}

.modal-topbar,
.modal-info-row {
  justify-content: space-between;
}

.modal-kicker {
  color: var(--main);
  font-size: 23rpx;
  font-weight: 800;
}

.modal-close {
  padding: 0 10rpx;
  color: var(--muted);
  font-size: 46rpx;
  line-height: 1;
}

.modal-dish-head {
  margin-top: 24rpx;
}

.modal-dish-art {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 112rpx;
  border-radius: 34rpx;
  background: #ffe1bd;
  font-size: 54rpx;
}

.modal-dish-copy {
  min-width: 0;
  margin-left: 20rpx;
}

.modal-title,
.modal-meta,
.modal-location {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-title {
  color: var(--text);
  font-size: 36rpx;
  font-weight: 800;
}

.modal-meta,
.modal-location {
  margin-top: 8rpx;
  color: var(--muted);
  font-size: 23rpx;
}

.modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 24rpx;
}

.modal-tag {
  padding: 6rpx 14rpx;
  border-radius: 16rpx;
  background: var(--light-orange);
  color: var(--dark-orange);
  font-size: 21rpx;
}

.modal-info-list {
  margin-top: 22rpx;
  padding: 4rpx 18rpx;
  border-radius: 22rpx;
  background: #fff4e8;
}

.modal-info-row {
  padding: 18rpx 0;
  border-bottom: 2rpx solid rgba(242, 215, 190, 0.6);
  color: var(--muted);
  font-size: 23rpx;
}

.modal-info-row:last-child {
  border-bottom: 0;
}

.modal-info-row text:last-child {
  color: var(--text);
  font-weight: 700;
}

.modal-actions {
  gap: 14rpx;
  margin-top: 26rpx;
}

.modal-secondary,
.modal-primary {
  flex: 1;
  margin: 0;
  border-radius: 22rpx;
  font-size: 25rpx;
}

.modal-secondary {
  border: 2rpx solid var(--border);
  background: #fff;
  color: var(--muted);
}

.modal-primary {
  border: 2rpx solid var(--dark-orange);
  background: var(--dark-orange);
  color: #fff;
}
</style>
