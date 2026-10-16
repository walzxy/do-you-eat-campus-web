<template>
  <view class="dish-card soft-card" @click="$emit('open', dish)">
    <view class="dish-art">🍜</view>
    <view class="dish-body">
      <text class="dish-title">{{ dish.title }}</text>
      <text class="dish-meta">{{ dish.priceText }} · {{ dish.locationText }}</text>
      <view class="dish-tags">
        <text v-if="dish.category_major" class="dish-tag">{{ dish.category_major }}</text>
        <text v-if="dish.flavor && dish.flavor !== '未知'" class="dish-tag">{{ dish.flavor }}</text>
      </view>
    </view>
    <text class="dish-arrow">›</text>
  </view>
</template>

<script setup>
defineProps({
  dish: { type: Object, required: true }
})

defineEmits(['open'])
</script>

<style scoped>
.dish-card {
  display: flex;
  align-items: center;
  margin-bottom: 18rpx;
  padding: 22rpx;
}

.dish-art {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 86rpx;
  height: 86rpx;
  border-radius: 28rpx;
  background: #ffe6c9;
  font-size: 42rpx;
}

.dish-body {
  flex: 1;
  min-width: 0;
  margin-left: 18rpx;
}

.dish-title,
.dish-meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dish-title {
  color: var(--text);
  font-size: 28rpx;
  font-weight: 800;
}

.dish-meta {
  margin-top: 8rpx;
  color: var(--muted);
  font-size: 22rpx;
}

.dish-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 10rpx;
}

.dish-tag {
  padding: 4rpx 10rpx;
  border-radius: 12rpx;
  background: var(--light-orange);
  color: var(--dark-orange);
  font-size: 19rpx;
}

.dish-arrow {
  margin-left: 10rpx;
  color: var(--main);
  font-size: 44rpx;
}
</style>
