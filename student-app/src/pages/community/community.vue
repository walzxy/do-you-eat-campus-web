<template>
  <view class="page-shell">
    <view class="content-width">
      <text class="page-title">社区</text>
      <text class="page-subtitle">看看大家刚刚吃了什么，也分享你的这一顿。</text>

      <view class="community-tabs">
        <text :class="['community-tab', { active: activeTab === 'feed' }]" @click="switchTab('feed')">最新动态</text>
        <text :class="['community-tab', { active: activeTab === 'rankings' }]" @click="switchTab('rankings')">评分榜</text>
      </view>

      <view v-if="activeTab === 'feed'" class="search-row">
        <input v-model="keyword" class="community-search" placeholder="搜索帖子或菜品" confirm-type="search" @confirm="loadPosts" />
        <button class="search-button" :disabled="loading" @click="loadPosts">搜索</button>
      </view>

      <view v-if="activeTab === 'feed'" class="composer-card soft-card">
        <textarea v-model="draftContent" class="composer-input" maxlength="1000" placeholder="说说你今天吃了什么…" />
        <view v-if="selectedDish" class="selected-dish">
          <text>🍜 {{ selectedDish.dish_name || selectedDish.name }}</text>
          <text class="remove-dish" @click="selectedDish = null">×</text>
        </view>
        <view class="composer-footer">
          <button class="history-picker" @click="showDishPicker = !showDishPicker">{{ showDishPicker ? '收起菜品' : '附上一道饭' }}</button>
          <button class="publish-button" :disabled="publishing || !draftContent.trim()" @click="publishPost">{{ publishing ? '发布中…' : '发布' }}</button>
        </view>
        <view v-if="showDishPicker" class="dish-picker-list">
          <text v-if="historyDishes.length === 0" class="picker-empty">先在转盘、筛选或详情页记录一顿饭吧。</text>
          <view v-for="dish in historyDishes" :key="dish.dish_id" class="picker-dish" @click="chooseDish(dish)">
            <text>{{ dish.dish_name || dish.name }}</text>
            <text>{{ dish.price_min ?? '' }}{{ dish.price_min !== undefined ? ' 元' : '' }}</text>
          </view>
        </view>
      </view>

      <view v-if="activeTab === 'rankings'" class="ranking-list">
        <view v-if="rankingLoading" class="empty-card soft-card">正在读取评分榜…</view>
        <view v-else-if="!rankings.length" class="empty-card soft-card">还没有评分，先去菜品详情页评一颗星吧。</view>
        <view v-for="(item, index) in rankings" :key="item.dish_id" class="ranking-card soft-card">
          <text class="ranking-index">{{ index + 1 }}</text>
          <view class="ranking-main">
            <text class="ranking-name">{{ item.dish?.dish_name || '未命名菜品' }}</text>
            <text class="ranking-meta">{{ item.dish?.cafeteria_name || '食堂待补充' }} · {{ item.rating_count }} 人评分</text>
          </view>
          <text class="ranking-score">{{ Number(item.rating_average || 0).toFixed(1) }} ★</text>
        </view>
      </view>

      <view v-if="activeTab === 'feed'" class="feed-heading">
        <text class="section-title">最新发布</text>
        <button class="refresh-feed" :disabled="loading" @click="loadPosts">刷新</button>
      </view>

      <view v-if="activeTab === 'feed' && error" class="error-card soft-card">{{ error }}</view>
      <view v-else-if="activeTab === 'feed' && loading && !posts.length" class="empty-card soft-card">正在读取社区…</view>
      <view v-else-if="activeTab === 'feed' && !posts.length" class="empty-card soft-card">还没有帖子，来分享第一顿饭吧。</view>
      <view v-for="post in posts" v-if="activeTab === 'feed'" :key="post.post_id" class="post-card soft-card">
        <view class="post-head">
          <view class="post-avatar">{{ post.author_avatar || '🍊' }}</view>
          <view class="post-author">
            <text class="author-name">{{ post.author_name || '匿名用户' }}</text>
            <text class="post-time">{{ formatTime(post.created_at) }}</text>
          </view>
          <text v-if="post.anonymous_id === anonymousId" class="delete-post" @click="removePost(post)">删除</text>
        </view>
        <text class="post-content">{{ post.content }}</text>
        <view v-if="post.dish_snapshot" class="post-dish-card">
          <text class="post-dish-icon">🍜</text>
          <view>
            <text class="post-dish-name">{{ post.dish_snapshot.dish_name }}</text>
            <text class="post-dish-meta">{{ post.dish_snapshot.price_min }}–{{ post.dish_snapshot.price_max }} 元 · {{ post.dish_snapshot.cafeteria_name || '食堂待补充' }}</text>
          </view>
        </view>
        <view class="post-actions">
          <text :class="['post-action', { active: post.liked }]" @click="toggleReaction(post, 'like')">♡ {{ post.like_count || 0 }}</text>
          <text :class="['post-action', { active: post.favorited }]" @click="toggleReaction(post, 'favorite')">☆ {{ post.favorite_count || 0 }}</text>
          <text class="post-action" @click="toggleComments(post)">评论 {{ post.comment_count || 0 }}</text>
        </view>
        <view v-if="expandedPostId === post.post_id" class="comments-panel">
          <view v-if="commentsLoading" class="comment-empty">评论读取中…</view>
          <view v-else-if="!comments.length" class="comment-empty">还没有评论，来说第一句吧。</view>
          <view v-for="comment in comments" :key="comment.comment_id" class="comment-row" :style="{ marginLeft: `${commentDepth(comment) * 24}rpx` }">
            <text class="comment-author">{{ comment.author_name || '匿名用户' }}</text>
            <text class="comment-content">{{ comment.content }}</text>
            <text class="reply-link" @click="replyTo(comment)">回复</text>
          </view>
          <view class="comment-composer">
            <input v-model="commentDraft" class="comment-input" :placeholder="replyTarget ? `回复 ${replyTarget.author_name}` : '写下你的评论'" confirm-type="send" @confirm="submitComment(post)" />
            <button class="comment-button" @click="submitComment(post)">发送</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import {
  createCommunityPost,
  createPostComment,
  deleteCommunityPost,
  getDishRankings,
  getCommunityPost,
  listCommunityPosts,
  togglePostReaction
} from '../../services/api'
import { getAnonymousIdentity, getHistory } from '../../services/localState'

const anonymousId = getAnonymousIdentity().id
const posts = ref([])
const rankings = ref([])
const historyDishes = ref([])
const draftContent = ref('')
const keyword = ref('')
const activeTab = ref('feed')
const selectedDish = ref(null)
const showDishPicker = ref(false)
const publishing = ref(false)
const loading = ref(false)
const rankingLoading = ref(false)
const error = ref('')
const expandedPostId = ref('')
const comments = ref([])
const commentsLoading = ref(false)
const commentDraft = ref('')
const replyTarget = ref(null)

onShow(() => {
  historyDishes.value = getHistory().map(item => item.dish).filter(Boolean).slice(0, 12)
  loadPosts()
})

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'rankings' && !rankings.value.length) loadRankings()
}

async function loadPosts() {
  loading.value = true
  error.value = ''
  try {
    const result = await listCommunityPosts(1, 20, keyword.value)
    posts.value = result.data || []
  } catch (requestError) {
    error.value = requestError.message || '社区读取失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function loadRankings() {
  rankingLoading.value = true
  try {
    rankings.value = await getDishRankings()
  } catch (requestError) {
    uni.showToast({ title: requestError.message || '评分榜读取失败', icon: 'none' })
  } finally {
    rankingLoading.value = false
  }
}

function chooseDish(dish) {
  selectedDish.value = dish
  showDishPicker.value = false
}

async function publishPost() {
  if (!draftContent.value.trim()) return
  publishing.value = true
  try {
    const post = await createCommunityPost({ content: draftContent.value.trim(), dish_id: selectedDish.value?.dish_id || null })
    posts.value.unshift(post)
    draftContent.value = ''
    selectedDish.value = null
    uni.showToast({ title: '发布成功', icon: 'success' })
  } catch (requestError) {
    uni.showToast({ title: requestError.message || '发布失败', icon: 'none' })
  } finally {
    publishing.value = false
  }
}

async function toggleReaction(post, kind) {
  try {
    const result = await togglePostReaction(post.post_id, kind)
    post[kind === 'like' ? 'liked' : 'favorited'] = result.active
    const field = kind === 'like' ? 'like_count' : 'favorite_count'
    post[field] = Math.max(0, (post[field] || 0) + (result.active ? 1 : -1))
  } catch (requestError) {
    uni.showToast({ title: requestError.message || '操作失败', icon: 'none' })
  }
}

async function toggleComments(post) {
  if (expandedPostId.value === post.post_id) {
    expandedPostId.value = ''
    return
  }
  expandedPostId.value = post.post_id
  commentsLoading.value = true
  replyTarget.value = null
  commentDraft.value = ''
  try {
    const detail = await getCommunityPost(post.post_id)
    comments.value = detail.comments || []
  } catch (requestError) {
    comments.value = []
    uni.showToast({ title: requestError.message || '评论读取失败', icon: 'none' })
  } finally {
    commentsLoading.value = false
  }
}

function replyTo(comment) {
  replyTarget.value = comment
}

async function submitComment(post) {
  if (!commentDraft.value.trim()) return
  try {
    const comment = await createPostComment(post.post_id, { content: commentDraft.value.trim(), parent_id: replyTarget.value?.comment_id || null })
    comments.value.push(comment)
    post.comment_count = (post.comment_count || 0) + 1
    commentDraft.value = ''
    replyTarget.value = null
  } catch (requestError) {
    uni.showToast({ title: requestError.message || '评论失败', icon: 'none' })
  }
}

async function removePost(post) {
  const result = await new Promise(resolve => uni.showModal({ title: '删除这条帖子？', content: '删除后无法恢复。', success: resolve }))
  if (!result.confirm) return
  try {
    await deleteCommunityPost(post.post_id)
    posts.value = posts.value.filter(item => item.post_id !== post.post_id)
  } catch (requestError) {
    uni.showToast({ title: requestError.message || '删除失败', icon: 'none' })
  }
}

function commentDepth(comment) {
  let depth = 0
  let parentId = comment.parent_id
  const seen = new Set()
  while (parentId && !seen.has(parentId) && depth < 6) {
    seen.add(parentId)
    const parent = comments.value.find(item => item.comment_id === parentId)
    if (!parent) break
    depth += 1
    parentId = parent.parent_id
  }
  return depth
}

function formatTime(value) {
  return new Date(value).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.empty-page {
  padding-top: 100rpx;
  text-align: center;
}

.empty-icon {
  font-size: 78rpx;
}

.placeholder-card {
  margin-top: 52rpx;
  padding: 34rpx;
  color: var(--muted);
  font-size: 26rpx;
}

.composer-card,
.post-card,
.ranking-card {
  margin-top: 24rpx;
  padding: 24rpx;
}

.community-tabs {
  display: flex;
  gap: 30rpx;
  margin-top: 28rpx;
  border-bottom: 2rpx solid rgba(242, 215, 190, 0.6);
}

.community-tab {
  padding: 0 4rpx 14rpx;
  color: var(--muted);
  font-size: 24rpx;
}

.community-tab.active {
  color: var(--dark-orange);
  border-bottom: 5rpx solid var(--dark-orange);
  font-weight: 750;
}

.search-row {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
}

.community-search {
  flex: 1;
  height: 62rpx;
  box-sizing: border-box;
  padding: 0 18rpx;
  border: 2rpx solid var(--border);
  border-radius: 18rpx;
  background: #fff;
  color: var(--text);
  font-size: 22rpx;
}

.search-button {
  height: 62rpx;
  margin: 0;
  padding: 0 20rpx;
  border-radius: 18rpx;
  background: var(--dark-orange);
  color: #fff;
  font-size: 22rpx;
  line-height: 58rpx;
}

.ranking-card {
  display: flex;
  align-items: center;
}

.ranking-index {
  width: 46rpx;
  color: var(--dark-orange);
  font-size: 30rpx;
  font-weight: 800;
}

.ranking-main {
  flex: 1;
}

.ranking-name,
.ranking-meta {
  display: block;
}

.ranking-name {
  color: var(--text);
  font-size: 24rpx;
  font-weight: 750;
}

.ranking-meta {
  margin-top: 6rpx;
  color: var(--muted);
  font-size: 19rpx;
}

.ranking-score {
  color: var(--dark-orange);
  font-size: 24rpx;
  font-weight: 800;
}

.composer-input {
  width: 100%;
  min-height: 150rpx;
  box-sizing: border-box;
  padding: 16rpx;
  border: 2rpx solid var(--border);
  border-radius: 20rpx;
  background: #fff;
  color: var(--text);
  font-size: 25rpx;
  line-height: 1.5;
}

.selected-dish,
.composer-footer,
.post-head,
.post-actions,
.comment-composer,
.feed-heading {
  display: flex;
  align-items: center;
}

.selected-dish {
  justify-content: space-between;
  margin-top: 14rpx;
  padding: 12rpx 16rpx;
  border-radius: 16rpx;
  background: var(--light-orange);
  color: var(--dark-orange);
  font-size: 22rpx;
}

.remove-dish {
  font-size: 34rpx;
}

.composer-footer,
.feed-heading {
  justify-content: space-between;
}

.composer-footer {
  margin-top: 18rpx;
}

.history-picker,
.publish-button,
.refresh-feed,
.comment-button {
  height: 62rpx;
  margin: 0;
  border-radius: 31rpx;
  font-size: 22rpx;
  line-height: 58rpx;
}

.history-picker,
.refresh-feed {
  padding: 0 18rpx;
  border: 2rpx solid var(--border);
  background: #fff;
  color: var(--dark-orange);
}

.publish-button,
.comment-button {
  padding: 0 26rpx;
  background: var(--dark-orange);
  color: #fff;
}

.dish-picker-list {
  margin-top: 16rpx;
  border-top: 2rpx solid rgba(242, 215, 190, 0.6);
}

.picker-dish {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 4rpx;
  border-bottom: 2rpx solid rgba(242, 215, 190, 0.45);
  color: var(--text);
  font-size: 22rpx;
}

.picker-dish text:last-child {
  color: var(--muted);
}

.picker-empty,
.comment-empty {
  display: block;
  padding: 16rpx 4rpx;
  color: var(--muted);
  font-size: 21rpx;
}

.feed-heading {
  margin-top: 42rpx;
}

.refresh-feed {
  height: 54rpx;
  line-height: 50rpx;
}

.post-head {
  gap: 14rpx;
}

.post-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 22rpx;
  background: #ffe1bd;
  font-size: 32rpx;
}

.post-author {
  flex: 1;
}

.author-name,
.post-time,
.post-content,
.post-dish-name,
.post-dish-meta,
.comment-author,
.comment-content {
  display: block;
}

.author-name {
  color: var(--text);
  font-size: 24rpx;
  font-weight: 750;
}

.post-time {
  margin-top: 4rpx;
  color: var(--muted);
  font-size: 19rpx;
}

.delete-post,
.reply-link {
  color: var(--dark-orange);
  font-size: 21rpx;
}

.post-content {
  margin-top: 20rpx;
  color: var(--text);
  font-size: 25rpx;
  line-height: 1.6;
  white-space: pre-wrap;
}

.post-dish-card {
  display: flex;
  align-items: center;
  margin-top: 18rpx;
  padding: 16rpx;
  border-radius: 20rpx;
  background: #fff4e8;
}

.post-dish-icon {
  margin-right: 14rpx;
  font-size: 34rpx;
}

.post-dish-name {
  color: var(--text);
  font-size: 23rpx;
  font-weight: 750;
}

.post-dish-meta {
  margin-top: 5rpx;
  color: var(--muted);
  font-size: 19rpx;
}

.post-actions {
  gap: 28rpx;
  margin-top: 22rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid rgba(242, 215, 190, 0.6);
}

.post-action {
  color: var(--muted);
  font-size: 22rpx;
}

.post-action.active {
  color: var(--dark-orange);
  font-weight: 750;
}

.comments-panel {
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.65);
}

.comment-row {
  position: relative;
  padding: 12rpx 0 12rpx 12rpx;
  border-bottom: 2rpx solid rgba(242, 215, 190, 0.45);
}

.comment-author {
  color: var(--dark-orange);
  font-size: 20rpx;
  font-weight: 750;
}

.comment-content {
  margin-top: 5rpx;
  color: var(--text);
  font-size: 22rpx;
  line-height: 1.5;
}

.reply-link {
  display: inline-block;
  margin-top: 6rpx;
}

.comment-composer {
  gap: 10rpx;
  margin-top: 14rpx;
}

.comment-input {
  flex: 1;
  height: 62rpx;
  box-sizing: border-box;
  padding: 0 14rpx;
  border: 2rpx solid var(--border);
  border-radius: 18rpx;
  background: #fff;
  color: var(--text);
  font-size: 21rpx;
}

.comment-button {
  height: 62rpx;
  line-height: 58rpx;
}

.error-card,
.empty-card {
  margin-top: 24rpx;
  padding: 30rpx 24rpx;
  color: var(--muted);
  font-size: 24rpx;
  text-align: center;
}

.error-card {
  color: #b84f31;
}
</style>
