// 起名结果列表页
const quotaManager = require('../../../utils/quota.js')
const { showSuccess, showError } = require('../../../utils/util.js')

// 评分颜色
function getScoreColor(score) {
  if (score >= 90) return '#d4af37'
  if (score >= 80) return '#52c41a'
  if (score >= 70) return '#4a90d9'
  return '#8a8a8a'
}

Page({
  data: {
    names: [],
    bazi: {},
    recordId: '',
    canShare: true,
    remainingShare: 2
  },

  async onLoad() {
    // 加载生成结果
    const result = wx.getStorageSync('generation_result')
    if (!result) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }

    // 处理名字数据
    const names = result.names.map((name, index) => ({
      ...name,
      scoreColor: getScoreColor(name.score),
      expanded: index === 0, // 第一个默认展开
      isFavorite: false
    }))

    this.setData({
      names,
      bazi: result.bazi,
      recordId: result.recordId
    })

    // 加载分享状态
    this.loadShareStatus()
  },

  // 每次显示时刷新配额（分享后返回时需要刷新显示）
  onShow() {
    // 强制刷新，不使用缓存
    this.loadShareStatus(true)
  },

  // 加载分享状态（forceRefresh: 确保获取最新数据，不使用缓存）
  async loadShareStatus(forceRefresh = false) {
    try {
      const quota = await quotaManager.getQuota(forceRefresh)
      this.setData({
        canShare: quota.canShare,
        remainingShare: quota.maxShareBonus
      })
    } catch (err) {
      console.error('加载分享状态失败:', err)
    }
  },

  // 展开/收起卡片
  toggleExpand(e) {
    const index = e.currentTarget.dataset.index
    const names = this.data.names
    names[index].expanded = !names[index].expanded
    this.setData({ names })
  },

  // 切换收藏
  async toggleFavorite(e) {
    const index = e.currentTarget.dataset.index
    const name = this.data.names[index]
    
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'toggleFavorite',
        data: {
          recordId: this.data.recordId,
          name: name.name,
          action: name.isFavorite ? 'remove' : 'add',
          nameData: {
            score: name.score,
            wuxing: name.wuxing,
            interpretation: name.interpretation
          }
        }
      })

      if (result.success) {
        const names = this.data.names
        names[index].isFavorite = result.isFavorite
        this.setData({ names })
        
        showSuccess(result.isFavorite ? '收藏成功' : '已取消收藏')
      }
    } catch (err) {
      console.error('收藏失败:', err)
      showError('操作失败')
    }
  },

  // 查看详情
  viewDetail(e) {
    const index = e.currentTarget.dataset.index
    wx.setStorageSync('current_name_index', index)
    wx.navigateTo({
      url: '/pages/result/detail/detail'
    })
  },

  // 分享结果
  shareResult() {
    // 触发分享菜单
  },

  // 生成海报
  generatePoster() {
    wx.navigateTo({
      url: '/pages/share/poster/poster'
    })
  },

  // 返回
  goBack() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 分享配置
  onShareAppMessage() {
    const scene = `result_${Date.now()}`
    quotaManager.recordShare(scene)
    
    const topName = this.data.names[0]
    return {
      title: `我家宝宝的候选名：${topName.name}，评分${topName.score}分`,
      path: `/pages/index/index?scene=${scene}`,
      imageUrl: ''
    }
  },

  onShareTimeline() {
    const scene = `timeline_${Date.now()}`
    quotaManager.recordShare(scene, 'timeline')

    const topName = this.data.names[0]
    return {
      title: `我家宝宝的候选名：${topName.name}，评分${topName.score}分`,
      query: `scene=${scene}`
    }
  }
})
