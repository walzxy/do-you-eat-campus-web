<template>
  <div class="admin-panel">
    <!-- 顶栏 -->
    <div class="admin-header">
      <h1 class="admin-title">管理面板</h1>
      <button class="logout-btn" @click="logout">退出</button>
    </div>

    <!-- Tab 导航 -->
    <div class="tab-bar">
      <button :class="['tab', { active: tab === 'dishes' }]" @click="tab = 'dishes'">菜品</button>
      <button :class="['tab', { active: tab === 'feedbacks' }]" @click="tab = 'feedbacks'">反馈</button>
      <button :class="['tab', { active: tab === 'system' }]" @click="tab = 'system'">系统</button>
    </div>

    <!-- ========== 菜品管理 ========== -->
    <div v-if="tab === 'dishes'" class="panel-section">
      <div class="toolbar">
        <input v-model="dishKeyword" placeholder="搜索菜品..." class="search-input" @input="searchDishes" />
        <button class="btn btn-primary" @click="openCreateDish">+ 新增</button>
      </div>
      <div v-if="dishesLoading" class="loading">加载中...</div>
      <div v-else-if="dishes.length === 0" class="empty">暂无菜品</div>
      <div v-else class="dish-list">
        <div v-for="dish in dishes" :key="dish.dish_id" class="dish-card">
          <div class="dish-info" @click="openEditDish(dish)">
            <div class="dish-name">{{ dish.dish_name }}</div>
            <div class="dish-meta">
              <span>{{ dish.price_min }} - {{ dish.price_max }}元</span>
              <span :class="['status-badge', dish.availability_status === '暂时未售卖' ? 'off' : 'on']">{{ dish.availability_status }}</span>
            </div>
            <div class="dish-meta small">{{ dish.category_major }} / {{ dish.category_minor }} · {{ dish.cafeteria_name || dish.cafeteria_id }} / {{ dish.window_name || dish.window_id }}</div>
          </div>
          <div class="dish-actions">
            <button class="action-btn" @click="openCopyDish(dish)" title="复制新增">复制</button>
            <button v-if="dish.availability_status === '暂时未售卖'" class="action-btn restore" @click="toggleStatus(dish, '已核实售卖')">恢复</button>
            <button v-else class="action-btn off-btn" @click="toggleStatus(dish, '暂时未售卖')">下架</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 反馈管理 ========== -->
    <div v-if="tab === 'feedbacks'" class="panel-section">
      <div class="toolbar">
        <select v-model="feedbackFilter" @change="loadFeedbacks" class="filter-select">
          <option value="">全部</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
          <option value="ignored">已忽略</option>
        </select>
      </div>
      <div v-if="feedbacksLoading" class="loading">加载中...</div>
      <div v-else-if="feedbacks.length === 0" class="empty">暂无反馈</div>
      <div v-else class="feedback-list">
        <div v-for="fb in feedbacks" :key="fb.feedback_id" class="feedback-card">
          <div class="fb-header">
            <span class="fb-id">{{ fb.feedback_id }}</span>
            <span :class="['fb-status', fb.status]">{{ statusLabel(fb.status) }}</span>
          </div>
          <div class="fb-body">{{ fb.description }}</div>
          <div class="fb-meta">
            <span>{{ fb.issue_type }}</span>
            <span>{{ fb.dish_name || '—' }}</span>
            <span>{{ new Date(fb.created_at).toLocaleDateString() }}</span>
          </div>
          <div class="fb-actions" v-if="fb.status === 'pending' || fb.status === 'processing'">
            <button class="action-btn" @click="updateFBStatus(fb, 'processing')" v-if="fb.status === 'pending'">标记处理中</button>
            <button class="action-btn restore" @click="updateFBStatus(fb, 'resolved')">标记已解决</button>
            <button class="action-btn off-btn" @click="updateFBStatus(fb, 'ignored')">忽略</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 系统管理 ========== -->
    <div v-if="tab === 'system'" class="panel-section">
      <h3 class="section-title">版本信息</h3>
      <div v-if="versionInfo" class="info-box">
        <p>当前版本：{{ versionInfo.current?.version_id || '无' }}</p>
        <p>发布时间：{{ versionInfo.current?.created_at ? new Date(versionInfo.current.created_at).toLocaleString() : '—' }}</p>
        <p>上一版本：{{ versionInfo.previous?.version_id || '无' }}</p>
        <p>历史版本数：{{ versionInfo.total_versions || 0 }}</p>
        <button v-if="versionInfo.previous" class="btn btn-warning" @click="doRollback">回滚到上一版本</button>
      </div>
      <h3 class="section-title">变更日志</h3>
      <div v-if="changeLog" class="changelog-list">
        <div v-for="entry in changeLog.items" :key="entry.change_id" class="changelog-item">
          <div class="cl-header">{{ entry.change_id }} - {{ entry.action }}</div>
          <div class="cl-meta">{{ entry.target_type }}: {{ entry.target_id }} · {{ new Date(entry.created_at).toLocaleString() }}</div>
          <div class="cl-reason" v-if="entry.reason">{{ entry.reason }}</div>
        </div>
      </div>
      <div v-else class="loading">加载中...</div>
    </div>
<!-- ========== 编辑/新增弹窗 ========== -->
    <div v-if="showDishModal" class="modal-overlay" @click.self="closeDishModal">
      <div class="modal-content">
        <h3>{{ isEditing ? '编辑菜品' : (isCopying ? '复制新增菜品' : '新增菜品') }}</h3>
        <div class="form-group"><label>菜品名称 *</label><input v-model="editForm.dish_name" class="form-input" /></div>
        <div class="form-group"><label>关键词</label><input v-model="editForm.keywords" class="form-input" /></div>
        <div v-if="!isEditing" class="form-group">
          <label>所属食堂 *</label>
          <select v-model="editForm.cafeteria_id" class="form-input" @change="onCafeteriaChange">
            <option value="">请选择</option>
            <option v-for="c in cafeterias" :key="c.cafeteria_id" :value="c.cafeteria_id">{{ c.cafeteria_name }}</option>
          </select>
        </div>
        <div v-if="!isEditing" class="form-group">
          <label>所属窗口 *</label>
          <select v-model="editForm.window_id" class="form-input" :disabled="!editForm.cafeteria_id">
            <option value="">请选择</option>
            <option v-for="w in windows" :key="w.window_id" :value="w.window_id">{{ w.window_name }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group half"><label>最低价 *</label><input v-model.number="editForm.price_min" type="number" min="0" class="form-input" /></div>
          <div class="form-group half"><label>最高价 *</label><input v-model.number="editForm.price_max" type="number" min="0" class="form-input" /></div>
        </div>
        <div class="form-group"><label>大类</label><input v-model="editForm.category_major" class="form-input" /></div>
        <div class="form-group"><label>小类</label><input v-model="editForm.category_minor" class="form-input" /></div>
        <div v-if="!isEditing" class="form-group"><label>口味</label><input v-model="editForm.flavor" class="form-input" /></div>
        <div v-if="!isEditing" class="form-group">
          <label>打包</label>
          <select v-model="editForm.is_packable" class="form-input">
            <option value="未知">未知</option><option value="是">是</option><option value="否">否</option>
          </select>
        </div>
        <div class="form-group"><label>修改原因</label><input v-model="editForm.reason" class="form-input" placeholder="说明修改原因..." /></div>
        <div v-if="modalError" class="modal-error">{{ modalError }}</div>
        <div class="modal-actions">
          <button class="btn" @click="closeDishModal">取消</button>
          <button class="btn btn-primary" @click="saveDish" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  isLoggedIn, clearToken, adminVerify,
  adminListDishes, adminUpdateDish, adminCreateDish, adminCopyDish, adminToggleDishStatus,
  adminListFeedbacks, adminUpdateFeedbackStatus,
  adminGetCafeterias, adminGetWindowsByCafeteria,
  adminGetVersions, adminRollback, adminGetChangeLog,
} from '../services/api.js';

export default {
  name: 'AdminPanelPage',
  setup() {
    const router = useRouter();
    onMounted(async () => {
      if (!isLoggedIn()) { router.push('/admin'); return; }
      try { await adminVerify(); } catch { clearToken(); window.location.hash = '#/admin'; return; }
      loadDishes(); loadFeedbacks(); loadVersionInfo(); loadChangeLog(); loadCafeterias();
    });

    const tab = ref('dishes');
    const dishes = ref([]);
    const dishesLoading = ref(false);
    const dishKeyword = ref('');
    const feedbacks = ref([]);
    const feedbacksLoading = ref(false);
    const feedbackFilter = ref('');
    const showDishModal = ref(false);
    const isEditing = ref(false);
    const isCopying = ref(false);
    const saving = ref(false);
    const modalError = ref('');
    const cafeterias = ref([]);
    const windows = ref([]);
    const editForm = ref({ dish_name: '', keywords: '', cafeteria_id: '', window_id: '', price_min: 0, price_max: 0, category_major: '', category_minor: '', flavor: '', is_packable: '未知', reason: '' });
    const versionInfo = ref(null);
async function searchDishes() {
      dishesLoading.value = true;
      try { const r = await adminListDishes(dishKeyword.value); dishes.value = r.data.data || r.data || []; }
      catch { dishes.value = []; } finally { dishesLoading.value = false; }
    }
    async function loadDishes() {
      dishesLoading.value = true;
      try { const r = await adminListDishes(); dishes.value = r.data.data || r.data || []; }
      catch { dishes.value = []; } finally { dishesLoading.value = false; }
    }
    async function loadFeedbacks() {
      feedbacksLoading.value = true;
      try { const r = await adminListFeedbacks(feedbackFilter.value); feedbacks.value = r.data.data || []; }
      catch { feedbacks.value = []; } finally { feedbacksLoading.value = false; }
    }
    function statusLabel(s) { return { pending: '待处理', processing: '处理中', resolved: '已解决', ignored: '已忽略' }[s] || s; }
    async function updateFBStatus(fb, status) {
      try { await adminUpdateFeedbackStatus(fb.feedback_id, { status, reason: '' }); fb.status = status; }
      catch (e) { alert('操作失败: ' + e.message); }
    }
    async function toggleStatus(dish, status) {
      if (!confirm(`确认${status === '暂时未售卖' ? '下架' : '恢复'}「${dish.dish_name}」？`)) return;
      try { await adminToggleDishStatus(dish.dish_id, { status, reason: '' }); dish.availability_status = status; }
      catch (e) { alert('操作失败: ' + e.message); }
    }
    async function loadCafeterias() {
      try { const r = await adminGetCafeterias(); cafeterias.value = r.data.data || []; } catch {}
    }
    async function onCafeteriaChange() {
      editForm.value.window_id = '';
      if (!editForm.value.cafeteria_id) { windows.value = []; return; }
      try { const r = await adminGetWindowsByCafeteria(editForm.value.cafeteria_id); windows.value = r.data.data || []; } catch { windows.value = []; }
    }
    function openEditDish(dish) {
      isEditing.value = true; isCopying.value = false;
      editForm.value = { dish_name: dish.dish_name, keywords: dish.keywords || '', cafeteria_id: dish.cafeteria_id, window_id: dish.window_id, price_min: dish.price_min, price_max: dish.price_max, category_major: dish.category_major || '', category_minor: dish.category_minor || '', flavor: dish.flavor || '', is_packable: dish.is_packable || '未知', reason: '', _id: dish.dish_id };
      showDishModal.value = true;
    }
    function openCreateDish() {
      isEditing.value = false; isCopying.value = false;
      editForm.value = { dish_name: '', keywords: '', cafeteria_id: '', window_id: '', price_min: 0, price_max: 0, category_major: '', category_minor: '', flavor: '', is_packable: '未知', reason: '' };
      showDishModal.value = true;
    }
    function openCopyDish(dish) {
      isEditing.value = false; isCopying.value = true;
      editForm.value = { dish_name: '', keywords: dish.keywords || '', cafeteria_id: dish.cafeteria_id, window_id: dish.window_id, price_min: dish.price_min, price_max: dish.price_max, category_major: dish.category_major || '', category_minor: dish.category_minor || '', flavor: dish.flavor || '', is_packable: dish.is_packable || '未知', reason: '复制新增', _copyFrom: dish.dish_id };
      showDishModal.value = true;
    }
    function closeDishModal() { showDishModal.value = false; modalError.value = ''; }
    async function saveDish() {
      if (!editForm.value.dish_name.trim()) { modalError.value = '菜品名称不能为空'; return; }
      saving.value = true; modalError.value = '';
      try {
        if (isEditing.value) {
          await adminUpdateDish(editForm.value._id, { dish_name: editForm.value.dish_name, keywords: editForm.value.keywords, price_min: editForm.value.price_min, price_max: editForm.value.price_max, category_major: editForm.value.category_major, category_minor: editForm.value.category_minor, reason: editForm.value.reason });
        } else if (isCopying.value) {
          await adminCopyDish(editForm.value._copyFrom, { dish_name: editForm.value.dish_name, price_min: editForm.value.price_min, price_max: editForm.value.price_max, keywords: editForm.value.keywords, reason: editForm.value.reason });
        } else {
          await adminCreateDish({ dish_name: editForm.value.dish_name, keywords: editForm.value.keywords, cafeteria_id: editForm.value.cafeteria_id, window_id: editForm.value.window_id, price_min: editForm.value.price_min, price_max: editForm.value.price_max, category_major: editForm.value.category_major, category_minor: editForm.value.category_minor, flavor: editForm.value.flavor, is_packable: editForm.value.is_packable, reason: editForm.value.reason });
        }
        closeDishModal(); loadDishes();
      } catch (e) { modalError.value = e.message || '保存失败'; } finally { saving.value = false; }
    }
    async function loadVersionInfo() { try { const r = await adminGetVersions(); versionInfo.value = r.data; } catch {} }
    async function loadChangeLog() { try { const r = await adminGetChangeLog(); changeLog.value = r.data; } catch {} }
    async function doRollback() {
      if (!confirm('确认回滚到上一版本？')) return;
      try { await adminRollback('手动回滚'); alert('回滚成功'); loadVersionInfo(); loadDishes(); }
      catch (e) { alert('回滚失败: ' + e.message); }
    }
    function logout() { clearToken(); router.push('/admin'); }

    return { tab, logout, dishes, dishesLoading, dishKeyword, searchDishes, feedbacks, feedbacksLoading, feedbackFilter, loadFeedbacks, statusLabel, updateFBStatus, toggleStatus, showDishModal, isEditing, isCopying, saving, modalError, editForm, cafeterias, windows, onCafeteriaChange, openEditDish, openCreateDish, openCopyDish, closeDishModal, saveDish, versionInfo, changeLog, doRollback };
  },
};
</script>
<style scoped>
.admin-panel { max-width: 800px; margin: 0 auto; padding: 12px; font-size: 14px; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.admin-title { font-size: 20px; font-weight: 700; }
.logout-btn { padding: 6px 14px; background: none; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; }
.tab-bar { display: flex; gap: 4px; margin-bottom: 16px; background: #f0f0f0; border-radius: 10px; padding: 4px; }
.tab { flex: 1; padding: 8px; text-align: center; border: none; background: transparent; border-radius: 8px; cursor: pointer; }
.tab.active { background: #fff; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.panel-section { min-height: 200px; }
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.search-input { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
.filter-select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
.btn { padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px; background: #fff; cursor: pointer; font-size: 14px; }
.btn-primary { background: #e74c3c; color: #fff; border-color: #e74c3c; }
.btn-warning { background: #f39c12; color: #fff; border-color: #f39c12; margin-top: 8px; }
.loading { text-align: center; padding: 40px; color: #999; }
.empty { text-align: center; padding: 40px; color: #999; }
.dish-list { display: flex; flex-direction: column; gap: 8px; }
.dish-card { background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 12px; display: flex; justify-content: space-between; align-items: center; }
.dish-info { flex: 1; cursor: pointer; }
.dish-name { font-weight: 600; font-size: 15px; margin-bottom: 2px; }
.dish-meta { font-size: 12px; color: #888; display: flex; gap: 8px; align-items: center; }
.dish-meta.small { margin-top: 2px; }
.status-badge { padding: 1px 6px; border-radius: 4px; font-size: 11px; }
.status-badge.on { background: #e8f5e9; color: #2e7d32; }
.status-badge.off { background: #ffebee; color: #c62828; }
.dish-actions { display: flex; gap: 4px; margin-left: 8px; }
.action-btn { padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; font-size: 12px; }
.restore { color: #2e7d32; border-color: #a5d6a7; }
.off-btn { color: #c62828; border-color: #ef9a9a; }
.feedback-list { display: flex; flex-direction: column; gap: 8px; }
.feedback-card { background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 12px; }
.fb-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.fb-id { font-weight: 600; font-size: 12px; color: #555; }
.fb-status { padding: 1px 6px; border-radius: 4px; font-size: 11px; }
.fb-status.pending { background: #fff3e0; color: #e65100; }
.fb-status.processing { background: #e3f2fd; color: #1565c0; }
.fb-status.resolved { background: #e8f5e9; color: #2e7d32; }
.fb-status.ignored { background: #f5f5f5; color: #888; }
.fb-body { font-size: 14px; margin-bottom: 4px; }
.fb-meta { font-size: 12px; color: #888; display: flex; gap: 8px; }
.fb-actions { display: flex; gap: 4px; margin-top: 8px; }
.section-title { font-size: 16px; font-weight: 600; margin: 16px 0 8px; }
.info-box { background: #f9f9f9; border-radius: 10px; padding: 12px; font-size: 13px; }
.info-box p { margin: 4px 0; }
.changelog-list { display: flex; flex-direction: column; gap: 6px; }
.changelog-item { background: #f9f9f9; border-radius: 8px; padding: 8px 12px; }
.cl-header { font-weight: 600; font-size: 13px; }
.cl-meta { font-size: 11px; color: #888; }
.cl-reason { font-size: 12px; margin-top: 2px; color: #555; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: #fff; border-radius: 16px; padding: 24px; width: 90%; max-width: 420px; max-height: 90vh; overflow-y: auto; }
.modal-content h3 { margin-bottom: 16px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.form-input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
.form-row { display: flex; gap: 12px; }
.form-row .half { flex: 1; }
.modal-error { color: #e74c3c; font-size: 13px; margin-bottom: 8px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
</style>