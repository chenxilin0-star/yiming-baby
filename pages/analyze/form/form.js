// 名字分析表单页
const { showSuccess, showError } = require('../../../utils/util.js')
const quotaManager = require('../../../utils/quota.js')

Page({
  data: {
    surname: '',
    name: '',
    solarDate: '',
    solarTime: '',
    gender: 1,
    canSubmit: false
  },

  // 姓氏输入
  onSurnameInput(e) {
    this.setData({
      surname: e.detail.value
    })
    this.checkCanSubmit()
  },

  // 名字输入
  onNameInput(e) {
    this.setData({
      name: e.detail.value
    })
    this.checkCanSubmit()
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      solarDate: e.detail.value
    })
    this.checkCanSubmit()
  },

  // 时间选择
  onTimeChange(e) {
    this.setData({
      solarTime: e.detail.value
    })
    this.checkCanSubmit()
  },

  // 性别选择
  selectGender(e) {
    const gender = parseInt(e.currentTarget.dataset.gender)
    this.setData({ gender })
    this.checkCanSubmit()
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { surname, name, solarDate, solarTime } = this.data
    const canSubmit = surname && name && solarDate && solarTime
    this.setData({ canSubmit })
  },

  // 分析名字
  async analyzeName() {
    const { surname, name, solarDate, solarTime, gender } = this.data

    if (!surname || !name || !solarDate || !solarTime) {
      showError('请填写完整信息')
      return
    }

    // 验证名字
    if (name.length < 1 || name.length > 3) {
      showError('名字长度应为1-3个字')
      return
    }

    try {
      wx.showLoading({ title: '分析中...' })

      // 调用云函数分析名字
      const { result } = await wx.cloud.callFunction({
        name: 'analyzeName',
        data: {
          surname,
          name,
          solarDate,
          solarTime,
          gender
        }
      })

      wx.hideLoading()

      if (result.success) {
        // 保存分析结果
        wx.setStorageSync('analyze_result', {
          ...result,
          inputName: surname + name
        })

        // 清除配额缓存，确保下次显示最新配额
        quotaManager.clearCache()

        // 跳转到结果页面
        wx.navigateTo({
          url: '/pages/analyze/result/result'
        })
      } else {
        // 根据错误类型显示不同提示
        const errorMsg = result.message || '分析失败，请重试'
        if (result.error === 'NOT_LOGGED_IN') {
          showError('请先登录后再使用')
        } else if (result.error === 'QUOTA_EXHAUSTED') {
          showError('今日次数已用完，分享可获得更多次数')
        } else {
          showError(errorMsg)
        }
      }
    } catch (err) {
      wx.hideLoading()
      console.error('名字分析失败:', err)
      showError('分析失败，请稍后重试')
    }
  },

  // 返回首页
  goBack() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
