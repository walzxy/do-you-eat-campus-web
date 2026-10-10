<template>
  <div><PageHeader title="反馈" />
    <div class="feedback-page">
      <div class="form-group">
        <label>问题类型 <span class="required">*</span></label>
        <select v-model="issueType">
          <option value="">请选择问题类型</option>
          <option v-for="t in issueTypes" :key="t" :value="t">{{ t }}</option>
        </select>
        <p v-if="errors.issueType" class="field-error">{{ errors.issueType }}</p>
      </div>
      <div class="form-group">
        <label>补充说明 <span class="required">*</span></label>
        <textarea v-model="description" rows="4" maxlength="500" placeholder="请描述具体情况..."></textarea>
        <p class="char-count">{{ description.length }}/500</p>
        <p v-if="errors.description" class="field-error">{{ errors.description }}</p>
      </div>
      <div class="form-group">
        <label>关联食堂（可选）</label>
        <select v-model="selectedCafeteria" @change="onCafeteriaChange">
          <option value="">请选择食堂</option>
          <option v-for="c in cafeterias" :key="c.cafeteria_id" :value="c.cafeteria_id">{{ c.cafeteria_name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>关联窗口（可选）</label>
        <select v-model="selectedWindow" @change="onWindowChange" :disabled="!selectedCafeteria">
          <option value="">请选择窗口</option>
          <option v-for="w in windows" :key="w.window_id" :value="w.window_id">{{ w.window_name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>关联菜品（可选）</label>
        <select v-model="selectedDish" :disabled="!selectedWindow">
          <option value="">请选择菜品</option>
          <option v-for="d in dishes" :key="d.dish_id" :value="d.dish_id">{{ d.dish_name }}</option>
        </select>
      </div>
      <button class="submit-btn" @click="submit" :disabled="submitting">{{ submitting ? '提交中...' : '提交反馈' }}</button>
      <div v-if="submitResult === 'success'" class="submit-success">
        <p>{{ successIcon }} 提交成功</p>
        <p>反馈编号：{{ feedbackId }}</p>
        <button class="back-home-btn" @click="$router.push('/')">返回主页</button>
      </div>
      <div v-if="submitError" class="submit-error">{{ submitError }}</div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue';
import PageHeader from '../components/PageHeader.vue';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export default {
  name: 'FeedbackPage',
  components: { PageHeader },
  setup() {
    const successIcon = '\u2705';
    const issueTypes = ['菜品不存在', '价格不符', '窗口信息错误', '供应状态错误', '其他'];
    const issueType = ref(''); const description = ref(''); const selectedCafeteria = ref(''); const selectedWindow = ref(''); const selectedDish = ref('');
    const submitting = ref(false); const submitResult = ref(''); const submitError = ref(''); const feedbackId = ref('');
    const errors = ref({ issueType: '', description: '' });
    const cafeterias = ref([]); const windows = ref([]); const dishes = ref([]);
    onMounted(async () => {
      try { const res = await fetch(API_BASE + '/cafeterias'); const json = await res.json(); cafeterias.value = json.data.data; } catch (e) {}
    });
    const onCafeteriaChange = async () => {
      selectedWindow.value = ''; selectedDish.value = ''; windows.value = []; dishes.value = [];
      if (!selectedCafeteria.value) return;
      try { const res = await fetch(API_BASE + '/cafeterias/' + selectedCafeteria.value + '/windows'); const json = await res.json(); if (!res.ok) return; windows.value = json.data.data; } catch (e) {}
    };
    const onWindowChange = async () => {
      selectedDish.value = ''; dishes.value = [];
      if (!selectedWindow.value) return;
      try { const res = await fetch(API_BASE + '/windows/' + selectedWindow.value + '/dishes'); const json = await res.json(); dishes.value = json.data.data; } catch (e) {}
    };
    const validate = () => {
      errors.value = { issueType: '', description: '' };
      if (!issueType.value) errors.value.issueType = '请选择问题类型';
      if (!description.value.trim()) errors.value.description = '请填写补充说明';
      else if (description.value.length > 500) errors.value.description = '补充说明不能超过500个字符';
      return !errors.value.issueType && !errors.value.description;
    };
    const submit = async () => {
      if (!validate()) return; if (submitting.value) return;
      submitting.value = true; submitResult.value = ''; submitError.value = '';
      try {
        const body = { issue_type: issueType.value, description: description.value.trim() };
        if (selectedCafeteria.value) body.cafeteria_id = selectedCafeteria.value;
        if (selectedWindow.value) body.window_id = selectedWindow.value;
        if (selectedDish.value) body.dish_id = selectedDish.value;
        const res = await fetch(API_BASE + '/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json();
        if (!res.ok) { submitError.value = json.error?.message || '提交失败'; }
        else { submitResult.value = 'success'; feedbackId.value = json.data.feedback_id; }
      } catch (e) { submitError.value = '网络错误，请稍后重试'; }
      finally { submitting.value = false; }
    };
    return { successIcon, issueTypes, issueType, description, selectedCafeteria, selectedWindow, selectedDish, submitting, submitResult, submitError, feedbackId, errors, cafeterias, windows, dishes, onCafeteriaChange, onWindowChange, submit };
  },
};
</script>
<style scoped>
.feedback-page { padding:16px; }
.form-group { margin-bottom:16px; }
.form-group label { display:block; font-size:14px; font-weight:600; margin-bottom:4px; }
.required { color:#e74c3c; }
.form-group select, .form-group textarea { width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; font-size:15px; font-family:inherit; }
.form-group textarea { resize:vertical; }
.char-count { text-align:right; font-size:12px; color:#999; margin-top:2px; }
.field-error { color:#e74c3c; font-size:13px; margin-top:2px; }
.submit-btn { width:100%; padding:14px; font-size:16px; background:#e74c3c; color:#fff; border:none; border-radius:12px; cursor:pointer; }
.submit-btn:disabled { opacity:0.6; }
.submit-success { text-align:center; padding:24px; margin-top:16px; background:#e8f5e9; border-radius:12px; }
.submit-success p { margin-bottom:8px; font-size:16px; }
.back-home-btn { padding:10px 24px; margin-top:8px; background:#fff; border:1px solid #ddd; border-radius:8px; font-size:15px; cursor:pointer; }
.submit-error { text-align:center; padding:12px; margin-top:12px; background:#ffebee; color:#e74c3c; border-radius:8px; font-size:14px; }
</style>
