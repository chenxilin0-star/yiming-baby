// SEO静态页面 - 用于搜索引擎收录
Page({
  data: {
    // 静态数据，无需动态加载
  },

  onLoad() {
    // 纯静态页面，无需额外逻辑
  },

  // 分享配置
  onShareAppMessage() {
    return {
      title: '易名宝宝 - 智能起名，免费宝宝起名大全',
      path: '/pages/seo/index/index'
    }
  },

  onShareTimeline() {
    return {
      title: '易名宝宝 - 智能起名，免费宝宝起名大全',
      query: ''
    }
  }
})
