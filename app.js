App({
  globalData: {
    userInfo: null,
    systemConfig: null
  },

  async onLaunch() {
    // 初始化云开发 - 使用默认环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloudbase-0grkq7777c86c387',
        traceUser: true
      })
      console.log('✓ 云开发初始化成功，环境: cloudbase-0grkq7777c86c387')
    }

    // 检查更新
    this.checkUpdate()

    // 获取系统配置
    this.getSystemConfig()

    // 确保用户登录（获取 openid）
    await this.ensureLogin()
  },

  // 确保用户登录
  async ensureLogin() {
    try {
      // 调用云函数获取 openid，确保登录状态
      const { result } = await wx.cloud.callFunction({
        name: 'getQuota'
      })
      console.log('用户登录状态正常:', result)
    } catch (err) {
      console.error('登录检查失败:', err)
    }
  },

  // 检查小程序更新
  checkUpdate() {
    const updateManager = wx.getUpdateManager()
    
    updateManager.onCheckForUpdate((res) => {
      console.log('检查更新结果:', res.hasUpdate)
    })

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })
  },

  // 获取系统配置
  async getSystemConfig() {
    // 先设置默认配置
    this.globalData.systemConfig = {
      baseDailyCount: 1,
      maxDailyCount: 3,
      shareBonusPerTime: 1,
      maxShareBonusPerDay: 2
    }
    
    try {
      const db = wx.cloud.database()
      const { data } = await db.collection('system_config').doc('quota_rules').get()
      if (data) {
        this.globalData.systemConfig = data
      }
    } catch (err) {
      // 静默处理错误，使用默认配置继续运行
      console.log('使用默认系统配置')
    }
  },

  // 获取用户信息
  async getUserInfo() {
    if (this.globalData.userInfo) {
      return this.globalData.userInfo
    }

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getUserInfo'
      })
      this.globalData.userInfo = result.data
      return result.data
    } catch (err) {
      console.error('获取用户信息失败:', err)
      return null
    }
  }
})
