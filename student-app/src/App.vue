<script>
import { ensureAccountSession, syncHistoryRecord } from './services/api'
import { getHistory } from './services/localState'

export default {
  onLaunch() {
    // 每日状态入口由 pages/status/status.vue 统一判断，避免在应用生命周期里重复跳转。
    ensureAccountSession()
      .then(async () => {
        const history = getHistory()
        for (const record of history) await syncHistoryRecord(record)
      })
      .catch((error) => console.warn('[Account] 匿名会话同步失败', error))
  }
}
</script>

<style>
@import './styles/theme.css';

page {
  background: #fff8ef;
  color: #292621;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

button::after {
  border: 0;
}
</style>
