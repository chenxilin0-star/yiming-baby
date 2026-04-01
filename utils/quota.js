// 配额管理类
const CACHE_KEY = 'quota_cache'
const CACHE_EXPIRE = 60 * 1000 // 1分钟缓存

class QuotaManager {
  constructor() {
    this.cache = null
    this.cacheTime = 0
  }

  // 获取今日次数
  async getQuota(forceRefresh = false) {
    // 检查缓存
    if (!forceRefresh && this.cache) {
      const now = Date.now()
      if (now - this.cacheTime < CACHE_EXPIRE) {
        return this.cache
      }
    }

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getQuota'
      })

      if (result.success !== false) {
        this.cache = result
        this.cacheTime = Date.now()
        // 同时存储到本地
        wx.setStorageSync(CACHE_KEY, {
          data: result,
          time: this.cacheTime
        })
        return result
      }
      throw new Error(result.error || '获取次数失败')
    } catch (err) {
      console.error('获取配额失败:', err)
      // 尝试使用本地缓存
      const localCache = wx.getStorageSync(CACHE_KEY)
      if (localCache && localCache.data) {
        return localCache.data
      }
      // 返回默认数据
      return {
        remaining: 1,
        total: 1,
        used: 0,
        canShare: true,
        maxShareBonus: 2
      }
    }
  }

  // 检查并消耗次数
  async useQuota(type = 'free') {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'checkAndUseQuota',
        data: { type }
      })

      if (result.success) {
        // 清除缓存
        this.clearCache()
        return result
      }
      throw new Error(result.error || '次数不足')
    } catch (err) {
      console.error('消耗次数失败:', err)
      throw err
    }
  }

  // 记录分享并奖励次数
  async recordShare(scene, shareType = 'friend') {
    try {
      console.log('[recordShare] 开始记录分享:', { scene, shareType })
      const { result } = await wx.cloud.callFunction({
        name: 'recordShare',
        data: { scene, type: shareType }
      })

      console.log('[recordShare] 云函数返回:', result)

      if (result.success) {
        // 清除缓存
        this.clearCache()
        if (result.bonusAdded > 0) {
          console.log('[recordShare] 分享记录成功，奖励次数:', result.bonusAdded)
        } else {
          console.log('[recordShare] 分享记录成功，但未获得奖励')
        }
        return result
      }
      // 失败情况才显示提示（避免点击分享按钮时闪屏）
      const errorMsg = result.message || result.error || '分享记录失败'
      console.warn('[recordShare] 分享记录失败:', errorMsg)
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      })
      throw new Error(errorMsg)
    } catch (err) {
      console.error('[recordShare] 记录分享异常:', err)
      // 只有在非"取消分享"的情况下才显示错误
      if (err.message && !err.message.includes('cancel')) {
        wx.showToast({
          title: '分享记录失败',
          icon: 'none',
          duration: 2000
        })
      }
      throw err
    }
  }

  // 清除缓存
  clearCache() {
    this.cache = null
    this.cacheTime = 0
    wx.removeStorageSync(CACHE_KEY)
  }

  // 检查是否有剩余次数
  async hasQuota() {
    const quota = await this.getQuota()
    return quota.remaining > 0
  }

  // 获取剩余次数文本
  async getRemainingText() {
    const quota = await this.getQuota()
    return `今日剩余 ${quota.remaining} 次`
  }
}

// 导出单例
module.exports = new QuotaManager()
