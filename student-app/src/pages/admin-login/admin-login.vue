<template>
  <view class="admin-login-page">
    <view class="admin-login-card soft-card">
      <text class="admin-kicker">今天吃了么</text>
      <text class="admin-title">管理模式</text>
      <text class="admin-subtitle">仅供管理员维护菜品数据使用</text>
      <input v-model="password" class="admin-input" type="password" placeholder="请输入管理口令" confirm-type="done" @confirm="login" />
      <button class="primary-button login-button" :disabled="loading" @click="login">{{ loading ? '验证中…' : '进入管理模式' }}</button>
      <text v-if="error" class="admin-error">{{ error }}</text>
      <text class="admin-safe-note">口令只发送给后端验证，不写入前端代码。</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { adminLogin } from '../../services/api'

const password = ref('')
const loading = ref(false)
const error = ref('')

async function login() {
  if (!password.value.trim()) {
    error.value = '请输入管理口令'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await adminLogin(password.value)
    uni.redirectTo({ url: '/pages/admin/admin' })
  } catch (requestError) {
    error.value = requestError.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 40rpx;
  background: var(--bg);
}

.admin-login-card {
  width: 100%;
  max-width: 620rpx;
  padding: 48rpx 34rpx;
  text-align: center;
}

.admin-kicker,
.admin-title,
.admin-subtitle,
.admin-safe-note,
.admin-error {
  display: block;
}

.admin-kicker {
  color: var(--main);
  font-size: 25rpx;
  font-weight: 700;
}

.admin-title {
  margin-top: 14rpx;
  color: var(--text);
  font-size: 42rpx;
  font-weight: 800;
}

.admin-subtitle {
  margin-top: 12rpx;
  color: var(--muted);
  font-size: 24rpx;
}

.admin-input {
  box-sizing: border-box;
  width: 100%;
  height: 88rpx;
  margin-top: 38rpx;
  padding: 0 24rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: #fff;
  color: var(--text);
  font-size: 28rpx;
  text-align: left;
}

.login-button {
  width: 100%;
  margin-top: 22rpx;
}

.admin-error {
  margin-top: 18rpx;
  color: #b84f31;
  font-size: 24rpx;
}

.admin-safe-note {
  margin-top: 28rpx;
  color: #b49a89;
  font-size: 21rpx;
}
</style>
