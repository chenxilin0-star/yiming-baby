// 首页逻辑
const quotaManager = require('../../utils/quota.js')

Page({
  data: {
    features: [
      { icon: '📊', name: '五行分析', desc: '精准分析', bgColor: '#f0f7ff', path: '/pages/form/step1/step1' },
      { icon: '☯️', name: '五行平衡', desc: '调和五行', bgColor: '#f0fff4', path: '/pages/form/step1/step1' },
      { icon: '☸️', name: '经典出处', desc: '诗词典故', bgColor: '#fffaf0', path: '/pages/form/step1/step1' },
      { icon: '🎵', name: '音律美学', desc: '朗朗上口', bgColor: '#f5f0ff', path: '/pages/form/step1/step1' },
      { icon: '🤖', name: '智能推荐', desc: '深度分析', bgColor: '#fff0f5', path: '/pages/form/step1/step1' },
      { icon: '📝', name: '名字分析', desc: '已有名字打分', bgColor: '#f0f5ff', path: '/pages/analyze/form/form' },
      { icon: '📜', name: '经典出处', desc: '诗意典故', bgColor: '#f0ffff', path: '/pages/form/step1/step1' }
    ],
    showNoQuotaModal: false,
    quota: { remaining: 1, total: 1 },
    hasQuota: true
  },

  onLoad() {
    this.loadQuota(false)
  },

  onShow() {
    // 每次显示时强制刷新配额，不使用缓存
    this.loadQuota(true)
  },

  async loadQuota(forceRefresh = false) {
    try {
      const quota = await quotaManager.getQuota(forceRefresh)
      this.setData({
        quota,
        hasQuota: quota.remaining > 0
      })
    } catch (err) {
      console.error('加载配额失败:', err)
    }
  },

  async startNaming() {
    if (!this.data.hasQuota) {
      this.setData({ showNoQuotaModal: true })
      return
    }

    wx.navigateTo({ url: '/pages/form/step1/step1' })
  },

  // 导航到功能页面
  navigateToFeature(e) {
    const feature = e.currentTarget.dataset.feature

    // 检查配额（所有功能都需要配额）
    if (!this.data.hasQuota) {
      this.setData({ showNoQuotaModal: true })
      return
    }

    if (feature === '名字分析') {
      wx.navigateTo({ url: '/pages/analyze/form/form' })
    } else {
      // 其他功能跳转到起名页面
      wx.navigateTo({ url: '/pages/form/step1/step1' })
    }
  },

  showQuotaDetail() {
    wx.showModal({
      title: '次数说明',
      content: '每日1次免费起名机会\n分享给好友可额外获得2次\n每日最多3次机会\n次数每日0点重置',
      showCancel: false
    })
  },

  closeNoQuotaModal() {
    this.setData({ showNoQuotaModal: false })
  },

  // 测试功能：增加起名次数
  async addTestQuota() {
    try {
      wx.showLoading({ title: '增加中...' })

      const { result } = await wx.cloud.callFunction({
        name: 'addTestQuota'
      })

      wx.hideLoading()

      if (result.success) {
        wx.showToast({
          title: '已增加1次',
          icon: 'success'
        })
        // 刷新配额显示
        quotaManager.clearCache()
        this.loadQuota(true)
      } else {
        wx.showToast({
          title: result.message || '增加失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('增加次数失败:', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  goBack() {
    // 首页不需要返回
  },

  onShareAppMessage() {
    const scene = `home_${Date.now()}`
    quotaManager.recordShare(scene)

    return {
      title: '易名宝宝 - 智能起名，传承国学文化',
      path: `/pages/index/index?scene=${scene}`
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const scene = `home_timeline_${Date.now()}`
    quotaManager.recordShare(scene, 'timeline')

    return {
      title: '易名宝宝 - 智能起名，传承国学文化',
      query: `scene=${scene}`
    }
  }
})
