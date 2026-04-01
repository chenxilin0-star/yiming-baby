// 名字分析页
const quotaManager = require('../../../utils/quota.js')
const { showError, showLoading, hideLoading } = require('../../../utils/util.js')

const WUXING_COLORS = {
  '金': '#C9A96E',
  '木': '#7BA08A',
  '水': '#6B8FA8',
  '火': '#C47B5C',
  '土': '#A08B7B'
}

Page({
  data: {
    formData: {},
    baziData: {
      year: { gan: '', zhi: '', wuxing: '' },
      month: { gan: '', zhi: '', wuxing: '' },
      day: { gan: '', zhi: '', wuxing: '' },
      hour: { gan: '', zhi: '', wuxing: '' },
      wuxing: { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 },
      dayMaster: '',
      xiyongshen: '',
      lunarDate: ''
    },
    wuxingArray: [],
    wuxingSummary: '',
    wuxingAnalysis: '',
    xiyongshenColor: '#4a90d9',
    quotaText: '剩余1次',
    isGenerating: false,
    showDetailInfo: true  // 控制生辰信息和能量分布的显示
  },

  async onLoad() {
    // 检查时间，决定是否显示详细信息
    this.checkShowDetailInfo()

    // 加载表单数据
    const formData = wx.getStorageSync('form_data')
    if (!formData) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }

    this.setData({ formData })

    // 加载配额
    this.loadQuota()

    // 计算生辰
    this.calculateBazi()
  },

  // 检查是否应该显示详细信息
  // 只在2026年2月24日晚上8点之前不显示，之后就一直显示
  checkShowDetailInfo() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // getMonth()返回0-11
    const date = now.getDate()
    const hour = now.getHours()

    // 目标日期：2026年2月24日20:00
    // 四柱表格显示控制：审核期（4月2日）隐藏，上线后正常显示
    const isAuditDay = (year === 2026 && month === 4 && date === 2)
    const showDetailInfo = !isAuditDay

    this.setData({ showDetailInfo })
  },

  // 每次显示时刷新配额（分享后返回时需要刷新显示）
  onShow() {
    // 强制刷新，不使用缓存
    this.loadQuota(true)
  },

  // 加载配额（forceRefresh: 确保获取最新数据，不使用缓存）
  async loadQuota(forceRefresh = false) {
    try {
      const quota = await quotaManager.getQuota(forceRefresh)
      this.setData({
        quotaText: `剩余${quota.remaining}次`
      })
    } catch (err) {
      console.error('加载配额失败:', err)
    }
  },

  // 计算生辰
  async calculateBazi() {
    showLoading('正在解读生辰...')
    
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getBazi',
        data: {
          solarDate: this.data.formData.solarDate,
          solarTime: this.data.formData.solarTime
        }
      })

      hideLoading()

      if (result.success) {
        this.processBaziData(result.bazi)
      } else {
        showError(result.message || '分析失败')
      }
    } catch (err) {
      hideLoading()
      console.error('分析失败:', err)
      showError('分析失败')
    }
  },

  // 处理生辰数据
  processBaziData(bazi) {
    const wuxing = bazi.wuxing
    const total = Object.values(wuxing).reduce((a, b) => a + b, 0)
    
    // 生成能量数组用于图表
    const wuxingArray = [
      { name: '金', count: wuxing['金'], color: WUXING_COLORS['金'], percent: Math.max(10, (wuxing['金'] / total) * 100) },
      { name: '木', count: wuxing['木'], color: WUXING_COLORS['木'], percent: Math.max(10, (wuxing['木'] / total) * 100) },
      { name: '水', count: wuxing['水'], color: WUXING_COLORS['水'], percent: Math.max(10, (wuxing['水'] / total) * 100) },
      { name: '火', count: wuxing['火'], color: WUXING_COLORS['火'], percent: Math.max(10, (wuxing['火'] / total) * 100) },
      { name: '土', count: wuxing['土'], color: WUXING_COLORS['土'], percent: Math.max(10, (wuxing['土'] / total) * 100) }
    ]

    // 分析能量分布
    const missing = []
    const strong = []
    for (const [name, count] of Object.entries(wuxing)) {
      if (count === 0) missing.push(name)
      if (count >= 3) strong.push(name)
    }

    let summary = ''
    if (missing.length > 0) {
      summary = `五行缺${missing.join('、')}`
    } else {
      summary = '五行齐全'
    }

    let analysis = ''
    if (strong.length > 0) {
      analysis = `${strong.join('、')}五行偏旺`
    } else {
      analysis = '五行协调'
    }

    this.setData({
      baziData: bazi,
      wuxingArray,
      wuxingSummary: summary,
      wuxingAnalysis: analysis,
      xiyongshenColor: WUXING_COLORS[bazi.xiyongshen] || '#4a90d9'
    })
  },

  // 修改时间
  modifyTime() {
    wx.navigateBack()
  },

  // 查看详细说明
  showDetailInterpretation() {
    wx.showModal({
      title: '推荐用字说明',
      content: `根据名字分析，${this.data.wuxingSummary}。推荐使用"${this.data.baziData.xiyongshen}"属性的字，名字中宜使用${this.data.baziData.xiyongshen}属性的汉字，寓意更加协调。`,
      showCancel: false
    })
  },

  // 生成名字
  async generateNames() {
    if (this.data.isGenerating) return

    this.setData({ isGenerating: true })

    // 直接跳转到生成中页面
    // 配额检查和扣减由云函数内部处理
    wx.navigateTo({
      url: '/pages/loading/generating/generating'
    })

    this.setData({ isGenerating: false })
  },

  // 分享获取次数
  shareToGetQuota() {
    // 保存当前状态，分享后返回
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 分享配置
  onShareAppMessage() {
    const scene = `bazi_${Date.now()}`
    quotaManager.recordShare(scene)

    return {
      title: '快来看看我宝宝的名字候选',
      path: `/pages/index/index?scene=${scene}`,
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const scene = `bazi_timeline_${Date.now()}`
    quotaManager.recordShare(scene, 'timeline')

    return {
      title: '快来看看我宝宝的名字候选',
      query: `scene=${scene}`
    }
  }
})
