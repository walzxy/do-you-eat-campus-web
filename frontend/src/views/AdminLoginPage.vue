<template>
  <div class="admin-login-page">
    <div class="login-card">
      <h1 class="login-title">管理面板</h1>
      <p class="login-subtitle">请输入管理密钥</p>
      <input
        v-model="password"
        type="password"
        class="login-input"
        placeholder="管理密钥"
        @keyup.enter="login"
        :disabled="loading"
      />
      <button class="login-btn" @click="login" :disabled="loading">
        {{ loading ? '验证中...' : '进入' }}
      </button>
      <p v-if="error" class="login-error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { adminLogin } from '../services/api.js';

export default {
  name: 'AdminLoginPage',
  setup() {
    const router = useRouter();
    const password = ref('');
    const loading = ref(false);
    const error = ref('');

    async function login() {
      if (!password.value.trim()) {
        error.value = '请输入管理密钥';
        return;
      }
      loading.value = true;
      error.value = '';
      try {
        await adminLogin(password.value);
        router.push('/admin/panel');
      } catch (e) {
        error.value = '口令错误';
      } finally {
        loading.value = false;
      }
    }

    return { password, loading, error, login };
  },
};
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 20px;
}
.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 28px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  text-align: center;
}
.login-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}
.login-subtitle {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}
.login-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  outline: none;
  margin-bottom: 16px;
  box-sizing: border-box;
}
.login-input:focus {
  border-color: #e74c3c;
}
.login-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}
.login-btn:disabled {
  opacity: 0.6;
}
.login-error {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 12px;
}
</style>