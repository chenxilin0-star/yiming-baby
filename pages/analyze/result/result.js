// 名字分析结果页
Page({
  data: {
    result: null,
    wuxingPercent: {}
  },

  onLoad() {
    // 获取分析结果
    const analyzeResult = wx.getStorageSync('analyze_result')
    if (!analyzeResult) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }

    // 计算评分颜色
    const scoreColor = this.getScoreColor(analyzeResult.score)

    // 获取能量数量 - 正确的路径是 bazi.wuxing
    const wuxingData = analyzeResult.bazi.wuxing || { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
    const total = (wuxingData['金'] + wuxingData['木'] + wuxingData['水'] + wuxingData['火'] + wuxingData['土']) || 1

    // 计算能量百分比
    const wuxingPercent = {
      金: wuxingData['金'] ? ((wuxingData['金'] / total) * 100).toFixed(1) : '0',
      木: wuxingData['木'] ? ((wuxingData['木'] / total) * 100).toFixed(1) : '0',
      水: wuxingData['水'] ? ((wuxingData['水'] / total) * 100).toFixed(1) : '0',
      火: wuxingData['火'] ? ((wuxingData['火'] / total) * 100).toFixed(1) : '0',
      土: wuxingData['土'] ? ((wuxingData['土'] / total) * 100).toFixed(1) : '0'
    }

    // 英文 key 的数据（用于 style 属性）
    const wuxingPercentEn = {
      jin: wuxingPercent.金,
      mu: wuxingPercent.木,
      shui: wuxingPercent.水,
      huo: wuxingPercent.火,
      tu: wuxingPercent.土
    }

    this.setData({
      result: {
        ...analyzeResult,
        scoreColor
      },
      wuxingPercent,
      wuxingPercentEn
    })
  },

  // 获取评分颜色
  getScoreColor(score) {
    if (score >= 90) return '#d4af37'
    if (score >= 80) return '#52c41a'
    if (score >= 70) return '#4a90d9'
    if (score >= 60) return '#ff9800'
    return '#dc3545'
  },

  // 分享结果
  shareResult() {
    const { result } = this.data
    return {
      title: `${result.input.fullName} 名字分析`,
      path: '/pages/index/index',
      imageUrl: ''
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      fail: () => {
        // 如果无法返回，跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },

  // 返回首页
  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
})
