// 个人中心页
const quotaManager = require('../../../utils/quota.js')

Page({
  data: {
    userInfo: {
      nickName: '',
      avatarUrl: ''
    },
    hasUserInfo: false,
    userId: '',
    showAuthModal: false,
    tempAvatarUrl: '',
    tempNickName: '',
    stats: {
      records: 0,
      favorites: 0,
      remainingQuota: 1
    }
  },

  onLoad() {
    this.checkUserInfo()
    this.loadStats()
  },

  onShow() {
    this.loadStats()
  },

  // 检查本地是否有用户信息
  checkUserInfo() {
    const userInfo = wx.getStorageSync('user_info')
    console.log('本地存储的用户信息:', userInfo)
    if (userInfo && userInfo.nickName) {
      this.setData({
        userInfo,
        hasUserInfo: true
      })
    } else {
      // 显示授权弹窗
      this.setData({ showAuthModal: true })
    }

    // 生成用户ID
    this.generateUserId()
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      tempAvatarUrl: avatarUrl
    })
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      tempNickName: e.detail.value
    })
  },

  // 确认授权
  confirmAuth() {
    const { tempAvatarUrl, tempNickName } = this.data

    if (!tempAvatarUrl) {
      wx.showToast({ title: '请选择头像', icon: 'none' })
      return
    }

    if (!tempNickName || tempNickName.trim() === '') {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    const userInfo = {
      nickName: tempNickName.trim(),
      avatarUrl: tempAvatarUrl
    }

    this.handleUserInfo(userInfo)
    this.setData({ showAuthModal: false })
  },

  // 取消授权
  cancelAuth() {
    this.setData({ showAuthModal: false })
  },

  // 生成用户ID
  generateUserId() {
    let userId = wx.getStorageSync('user_id')
    if (!userId) {
      userId = String(Date.now()).slice(-8)
      wx.setStorageSync('user_id', userId)
    }
    this.setData({ userId })
  },

  // 处理用户信息
  handleUserInfo(userInfo) {
    if (!userInfo) {
      wx.showToast({ title: '获取信息失败', icon: 'none' })
      return
    }

    console.log('处理用户信息:', userInfo)

    const info = {
      nickName: userInfo.nickName || '微信用户',
      avatarUrl: userInfo.avatarUrl || ''
    }

    this.setData({
      userInfo: info,
      hasUserInfo: true
    })

    // 保存到本地
    wx.setStorageSync('user_info', info)

    // 上传到云端
    this.saveUserInfoToCloud(info)

    wx.showToast({ title: '授权成功', icon: 'success' })
  },

  // 保存用户信息到云端
  async saveUserInfoToCloud(userInfo) {
    try {
      const db = wx.cloud.database()
      const { data } = await db.collection('users').get()
      
      const userData = {
        nickName: userInfo.nickName || '微信用户',
        avatarUrl: userInfo.avatarUrl || '',
        updateTime: db.serverDate()
      }
      
      if (data.length > 0) {
        await db.collection('users').doc(data[0]._id).update({ data: userData })
      } else {
        await db.collection('users').add({
          data: {
            ...userData,
            totalGenerations: 0,
            totalShares: 0,
            firstGenerationTime: db.serverDate(),
            vipLevel: 0,
            vipExpireAt: null,
            lastUsedSurname: '',
            createTime: db.serverDate()
          }
        })
      }
    } catch (e) {
      console.log('保存云端失败:', e)
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      const quota = await quotaManager.getQuota()
      
      // 获取收藏数量
      let favoritesCount = 0
      try {
        const { result } = await wx.cloud.callFunction({
          name: 'getFavorites',
          data: { page: 1, pageSize: 1 }
        })
        if (result.success) {
          favoritesCount = result.total
        }
      } catch (e) {
        console.log('获取收藏数量失败')
      }

      this.setData({
        'stats.favorites': favoritesCount,
        'stats.remainingQuota': quota.remaining
      })
    } catch (err) {
      console.error('加载统计失败:', err)
    }
  },

  // 跳转到收藏
  goToFavorites() {
    wx.navigateTo({
      url: '/pages/user/favorites/favorites'
    })
  },

  // 跳转到记录
  goToRecords() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 显示次数详情
  showQuotaDetail() {
    wx.showModal({
      title: '次数说明',
      content: '每日1次免费起名机会\n分享给好友可额外获得2次\n每日最多3次机会',
      showCancel: false
    })
  },

  // VIP功能预告
  showVIPComing() {
    wx.showModal({
      title: '敬请期待',
      content: 'VIP功能正在内测中，敬请期待！',
      showCancel: false
    })
  },

  // 专家咨询预告
  showExpertComing() {
    wx.showModal({
      title: '敬请期待',
      content: '专家咨询服务即将上线，敬请期待！',
      showCancel: false
    })
  },

  // 使用帮助
  showHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '1. 填写宝宝姓氏、性别和出生时间\n2. 查看五行分析结果\n3. 获取系统生成的吉祥好名\n4. 收藏喜欢的名字\n\n每日1次免费机会，分享可获得更多次数。',
      showCancel: false
    })
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于易名宝宝',
      content: '易名宝宝是一款基于传统国学文化的智能起名工具，结合五行分析，为您提供专业的起名服务。\n\n微信号：xym7563',
      showCancel: false
    })
  },

  // 意见反馈
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '如有任何问题或建议，欢迎联系我们。\n\n微信号：xym7563',
      showCancel: false
    })
  },

  // 隐私政策
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护，仅收集必要的信息用于提供服务。您的个人信息将严格保密。',
      showCancel: false
    })
  }
})
