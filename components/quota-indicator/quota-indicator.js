// 次数指示器组件
const quotaManager = require('../../utils/quota.js')

Component({
  properties: {
    showDetail: {
      type: Boolean,
      value: false
    }
  },

  data: {
    remaining: 1,
    total: 1
  },

  lifetimes: {
    attached() {
      this.loadQuota()
    }
  },

  methods: {
    async loadQuota() {
      try {
        const quota = await quotaManager.getQuota()
        this.setData({
          remaining: quota.remaining,
          total: quota.total
        })
      } catch (err) {
        console.error('加载配额失败:', err)
      }
    },

    onTap() {
      this.triggerEvent('tap')
    }
  }
})
