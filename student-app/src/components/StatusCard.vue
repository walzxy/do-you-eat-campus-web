<template>
  <view
    class="status-card"
    :class="{ 'status-card--selected': selected }"
    @click="$emit('select', option.value)"
  >
    <view class="status-icon">{{ option.icon }}</view>
    <view class="status-copy">
      <text class="status-label">{{ option.label }}</text>
      <text class="status-hint">{{ option.hint }}</text>
    </view>
    <view class="status-check" :class="{ 'status-check--selected': selected }">
      <text v-if="selected">✓</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  option: { type: Object, required: true },
  selected: { type: Boolean, default: false }
})

defineEmits(['select'])
</script>

<style scoped>
.status-card {
  display: flex;
  align-items: center;
  min-height: 132rpx;
  box-sizing: border-box;
  padding: 22rpx 20rpx;
  border: 2rpx solid var(--border);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.76);
  transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease;
}

.status-card:active {
  transform: scale(0.985);
}

.status-card--selected {
  border-color: var(--main);
  background: var(--light-orange);
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66rpx;
  height: 66rpx;
  border-radius: 22rpx;
  background: #fff8ef;
  font-size: 38rpx;
}

.status-copy {
  flex: 1;
  min-width: 0;
  margin-left: 16rpx;
}

.status-label,
.status-hint {
  display: block;
}

.status-label {
  color: var(--text);
  font-size: 30rpx;
  font-weight: 750;
}

.status-hint {
  margin-top: 6rpx;
  overflow: hidden;
  color: var(--muted);
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border: 2rpx solid var(--border);
  border-radius: 50%;
  color: var(--white);
  font-size: 23rpx;
  font-weight: 800;
}

.status-check--selected {
  border-color: var(--main);
  background: var(--main);
}
</style>
