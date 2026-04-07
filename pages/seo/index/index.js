// SEO静态页面 - 用于搜索引擎收录
Page({
  data: {
    // 静态数据，无需动态加载
  },

  onLoad(options) {
    // 记录来源（用于分析SEO流量）
    if (options && options.from) {
      console.log('SEO页面来源:', options.from)
    }
  },

  // 跳转到起名页面
  goToNaming() {
    wx.navigateTo({ url: '/pages/form/step1/step1' })
  },

  // 跳转到名字分析
  goToAnalyze() {
    wx.navigateTo({ url: '/pages/analyze/form/form' })
  },

  // 分享配置 - 优化关键词覆盖
  onShareAppMessage() {
    return {
      title: '易名宝宝 - 免费宝宝起名取名 | 诗经楚辞智能起名大全',
      path: '/pages/seo/index/index?from=share',
      imageUrl: '/images/share_cover.png'
    }
  },

  onShareTimeline() {
    return {
      title: '易名宝宝 - 免费宝宝起名取名 | 2026蛇宝宝起名大全',
      query: 'from=timeline',
      imageUrl: '/images/share_cover.png'
    }
  }
})
