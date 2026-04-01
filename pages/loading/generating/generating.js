// 生成中Loading页
const { showModal } = require('../../../utils/util.js')

Page({
  data: {
    progress: 0,
    currentStatus: '正在分析宝宝信息...',
    remainingTime: 5,
    tasks: [
      { text: '解读天赋特质', done: false, active: true },
      { text: '匹配经典出处', done: false, active: false },
      { text: '筛选吉祥汉字', done: false, active: false },
      { text: '优化音律搭配', done: false, active: false }
    ],
    formData: {},
    timer: null
  },

  onLoad() {
    // 加载表单数据
    const formData = wx.getStorageSync('form_data')
    if (!formData) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }

    this.setData({ formData })
    
    // 开始生成
    this.startGenerating()
  },

  onUnload() {
    // 清除定时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  },

  // 开始生成
  startGenerating() {
    let progress = 0
    
    // 模拟进度更新
    this.data.timer = setInterval(() => {
      progress += Math.random() * 15
      if (progress > 90) progress = 90
      
      this.updateProgress(Math.floor(progress))
      
      if (progress >= 90) {
        clearInterval(this.data.timer)
        // 真正调用生成接口
        this.callGenerateAPI()
      }
    }, 500)

    // 更新剩余时间
    let remaining = 5
    const timeTimer = setInterval(() => {
      remaining--
      if (remaining <= 0) {
        clearInterval(timeTimer)
      } else {
        this.setData({ remainingTime: remaining })
      }
    }, 1000)
  },

  // 更新进度
  updateProgress(progress) {
    const tasks = this.data.tasks
    
    // 更新任务状态
    if (progress >= 20) {
      tasks[0].done = true
      tasks[0].active = false
      tasks[1].active = true
    }
    if (progress >= 45) {
      tasks[1].done = true
      tasks[1].active = false
      tasks[2].active = true
    }
    if (progress >= 70) {
      tasks[2].done = true
      tasks[2].active = false
      tasks[3].active = true
    }

    // 更新状态文字
    let status = this.data.currentStatus
    if (progress < 20) status = '正在分析宝宝信息...'
    else if (progress < 45) status = '正在匹配经典出处...'
    else if (progress < 70) status = '正在筛选吉祥汉字...'
    else status = '正在优化音律搭配...'

    this.setData({
      progress,
      currentStatus: status,
      tasks
    })
  },

  // 调用生成接口
  async callGenerateAPI() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'generateNames',
        data: this.data.formData
      })

      if (result.success) {
        // 完成
        this.setData({
          progress: 100,
          'tasks.3.done': true,
          'tasks.3.active': false,
          currentStatus: '生成完成！'
        })

        // 保存结果
        wx.setStorageSync('generation_result', result)

        // 延迟跳转到结果页
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/result/list/list'
          })
        }, 500)
      } else {
        // 根据错误类型显示不同提示
        if (result.error === 'QUOTA_EXHAUSTED') {
          wx.showModal({
            title: '次数已用完',
            content: '今日次数已用完，分享好友可获得更多机会',
            confirmText: '去分享',
            cancelText: '返回',
            success: (res) => {
              if (res.confirm) {
                // 跳转到首页分享
                wx.switchTab({
                  url: '/pages/index/index'
                })
              } else {
                wx.navigateBack()
              }
            }
          })
        } else {
          throw new Error(result.message || '生成失败')
        }
      }
    } catch (err) {
      console.error('生成名字失败:', err)
      wx.showModal({
        title: '生成失败',
        content: err.message || '请检查网络后重试',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
    }
  },

  // 确认取消
  async confirmCancel() {
    const confirm = await showModal('确认取消', '确定取消？已消耗次数不会返还')
    if (confirm) {
      if (this.data.timer) {
        clearInterval(this.data.timer)
      }
      wx.navigateBack()
    }
  }
})
