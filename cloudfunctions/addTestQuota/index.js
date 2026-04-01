// 云函数：测试功能 - 增加取名宝宝次数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const userId = openid || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    const today = getTodayString()

    // 查询今日配额
    let quotaRes = await db.collection('daily_quota')
      .where({
        _openid: userId,
        date: today
      })
      .get()

    let quota

    if (quotaRes.data.length === 0) {
      // 创建新配额记录
      quota = {
        _openid: userId,
        date: today,
        dateObj: new Date(),
        baseCount: 2, // 基础次数设为2
        usedCount: 0,
        shareCount: 0,
        bonusCount: 0,
        shareDetails: [],
        isExhausted: false,
        createTime: new Date(),
        updateTime: new Date()
      }

      const addRes = await db.collection('daily_quota').add({ data: quota })
      quota._id = addRes._id
    } else {
      // 增加基础次数
      quota = quotaRes.data[0]
      await db.collection('daily_quota').doc(quota._id).update({
        data: {
          baseCount: _.inc(1),
          updateTime: new Date()
        }
      })
    }

    // 获取更新后的配额
    const updatedQuota = await db.collection('daily_quota').doc(quota._id).get()
    const newQuota = updatedQuota.data
    const remaining = newQuota.baseCount + newQuota.bonusCount - newQuota.usedCount

    return {
      success: true,
      message: '已增加1次取名宝宝机会',
      remaining: Math.max(0, remaining)
    }

  } catch (err) {
    console.error('增加次数失败:', err)
    return {
      success: false,
      error: 'SYSTEM_ERROR',
      message: '操作失败，请重试'
    }
  }
}
