// 云函数：生成分享海报参数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { nameData, baziData, template = 'simple' } = event

  if (!openid) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: '用户未登录'
    }
  }

  try {
    // 生成小程序码（需要开通云开发静态网站）
    // 这里返回海报生成所需的参数，实际绘制在前端完成
    
    const posterConfig = {
      template,
      width: 750,
      height: 1334,
      background: {
        type: 'image',
        url: 'cloud://your-env/poster-bg.png', // 背景图URL
        color: '#fafafa'
      },
      elements: [
        {
          type: 'text',
          text: '国学智能起名',
          x: 375,
          y: 150,
          fontSize: 40,
          color: '#1a1a1a',
          textAlign: 'center'
        },
        {
          type: 'line',
          x1: 250,
          y1: 200,
          x2: 500,
          y2: 200,
          color: '#6B8E7B',
          width: 2
        },
        {
          type: 'text',
          text: nameData?.name || '李沐辰',
          x: 375,
          y: 350,
          fontSize: 80,
          color: '#1a1a1a',
          textAlign: 'center',
          fontWeight: 'bold'
        },
        {
          type: 'text',
          text: `能量：${nameData?.wuxing || '水+土'}`,
          x: 375,
          y: 450,
          fontSize: 30,
          color: '#4a4a4a',
          textAlign: 'center'
        },
        {
          type: 'text',
          text: `寓意：${nameData?.interpretation || '如沐春风，温润而泽'}`,
          x: 375,
          y: 500,
          fontSize: 28,
          color: '#8a8a8a',
          textAlign: 'center'
        },
        {
          type: 'qrcode',
          x: 275,
          y: 750,
          size: 200,
          scene: `poster_${Date.now()}`
        },
        {
          type: 'text',
          text: '长按扫码，为宝宝取好名',
          x: 375,
          y: 1000,
          fontSize: 26,
          color: '#8a8a8a',
          textAlign: 'center'
        },
        {
          type: 'text',
          text: baziData?.lunarDate || '甲辰年',
          x: 375,
          y: 1100,
          fontSize: 24,
          color: '#8a8a8a',
          textAlign: 'center'
        },
        {
          type: 'text',
          text: `八字喜用：${baziData?.xiyongshen || '水、金'}`,
          x: 375,
          y: 1150,
          fontSize: 24,
          color: '#6B8E7B',
          textAlign: 'center'
        }
      ]
    }

    return {
      success: true,
      config: posterConfig,
      scene: `poster_${openid.slice(-8)}_${Date.now()}`
    }

  } catch (err) {
    console.error('生成海报参数失败:', err)
    return {
      success: false,
      error: 'SYSTEM_ERROR',
      message: '生成海报失败'
    }
  }
}
