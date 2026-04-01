// 名字详情页
const quotaManager = require('../../../utils/quota.js')
const { showSuccess, showError } = require('../../../utils/util.js')

const WUXING_COLORS = {
  '金': '#d4af37',
  '木': '#5a9a5a',
  '水': '#4a90d9',
  '火': '#e74c3c',
  '土': '#8b7355'
}

Page({
  data: {
    nameData: {},
    baziData: {},
    recordId: '',
    isFavorite: false,
    scoreColor: '#d4af37',
    scoreLevel: '上吉',
    wuxingColors: WUXING_COLORS,
    pinyinArray: [],
    shengdiaoDesc: '',
    yunmuDesc: '',
    guaSymbol: '',
    guaPersonality: '',
    guaCareer: '',
    modernInterpretation: '',
    wuge: {}
  },

  onLoad() {
    // 加载当前名字数据
    const result = wx.getStorageSync('generation_result')
    const index = wx.getStorageSync('current_name_index') || 0
    
    if (!result || !result.names[index]) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }

    const nameData = result.names[index]
    const score = nameData.score

    console.log('========== 名字详情 ==========')
    console.log('nameData:', nameData)
    console.log('wuge:', nameData.wuge)

    // 评分等级
    let scoreLevel = '上吉'
    let scoreColor = '#d4af37'
    if (score < 90) {
      scoreLevel = '吉'
      scoreColor = '#52c41a'
    } else if (score < 80) {
      scoreLevel = '中吉'
      scoreColor = '#4a90d9'
    }

    // 生成拼音数组
    const pinyinArray = nameData.singleChars.map(c => `${c.char}(${c.pinyin})`)
    
    // 生成音律描述（简化）
    const shengdiaoDesc = '仄仄平，起伏有致'
    const yunmuDesc = '错落有致'

    // 经典出处解读
    const guaSymbol = '喜悦、沟通、和谐'
    const guaPersonality = '外柔内刚，善于表达'
    const guaCareer = '适合人际、传播、教育领域'

    // 现代寓意
    const modernInterpretation = `\"${nameData.singleChars[0].char}\"有${nameData.singleChars[0].meaning}之意，\"${nameData.singleChars[1].char}\"指${nameData.singleChars[1].meaning}。整体：${nameData.interpretation}`

    this.setData({
      nameData,
      baziData: result.bazi,
      recordId: result.recordId,
      scoreColor,
      scoreLevel,
      pinyinArray,
      shengdiaoDesc,
      yunmuDesc,
      guaSymbol,
      guaPersonality,
      guaCareer,
      modernInterpretation,
      wuge: nameData.wuge || {}
    })

    // 检查收藏状态
    this.checkFavoriteStatus()
  },

  // 检查收藏状态
  async checkFavoriteStatus() {
    try {
      const db = wx.cloud.database()
      const { data } = await db.collection('favorites')
        .where({
          _openid: '{openid}',
          recordId: this.data.recordId,
          name: this.data.nameData.name
        })
        .get()
      
      this.setData({
        isFavorite: data.length > 0
      })
    } catch (e) {
      console.log('检查收藏状态失败')
    }
  },

  // 切换收藏
  async toggleFavorite() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'toggleFavorite',
        data: {
          recordId: this.data.recordId,
          name: this.data.nameData.name,
          action: this.data.isFavorite ? 'remove' : 'add',
          nameData: {
            score: this.data.nameData.score,
            wuxing: this.data.nameData.wuxing,
            interpretation: this.data.nameData.interpretation
          }
        }
      })

      if (result.success) {
        this.setData({
          isFavorite: result.isFavorite
        })
        showSuccess(result.isFavorite ? '收藏成功' : '已取消收藏')
      }
    } catch (err) {
      showError('操作失败')
    }
  },

  // 播放拼音
  playPinyin() {
    // 使用微信小程序的语音合成
    const name = this.data.nameData.name
    const innerAudioContext = wx.createInnerAudioContext()
    // 这里可以使用第三方TTS服务
    wx.showToast({
      title: '播放: ' + name,
      icon: 'none'
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 重新生成
  regenerate() {
    wx.showModal({
      title: '重新生成',
      content: '确定要重新生成一批名字吗？将消耗1次机会',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/loading/generating/generating'
          })
        }
      }
    })
  },

  // 分享
  onShareAppMessage() {
    const scene = `detail_${Date.now()}`
    quotaManager.recordShare(scene)

    return {
      title: `推荐名字：${this.data.nameData.name}，评分${this.data.nameData.score}分`,
      path: `/pages/index/index?scene=${scene}`,
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const scene = `detail_timeline_${Date.now()}`
    quotaManager.recordShare(scene, 'timeline')

    return {
      title: `推荐名字：${this.data.nameData.name}，评分${this.data.nameData.score}分`,
      query: `scene=${scene}`
    }
  }
})
