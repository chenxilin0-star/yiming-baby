// 云函数：记录分享并奖励次数
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

async function getSystemConfig() {
  try {
    const { data } = await db.collection('system_config').doc('quota_rules').get()
    return data
  } catch (err) {
    return {
      shareBonusPerTime: 1,
      maxShareBonusPerDay: 2
    }
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { scene, type = 'friend' } = event

  if (!openid) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: '用户未登录'
    }
  }

  try {
    const today = getTodayString()
    const config = await getSystemConfig()

    // 查询今日配额
    let quotaRes = await db.collection('daily_quota')
      .where({
        _openid: openid,
        date: today
      })
      .get()

    let quota

    if (quotaRes.data.length === 0) {
      // 创建新配额记录
      quota = {
        _openid: openid,
        date: today,
        dateObj: new Date(),
        baseCount: 1,
        usedCount: 0,
        shareCount: 0,
        bonusCount: 0,
        shareDetails: [],
        isExhausted: false,
        createTime: new Date(),
        updateTime: new Date()
      }
      const addRes = await db.collection('daily_quota').add({
        data: quota
      })
      quota._id = addRes._id
    } else {
      quota = quotaRes.data[0]
    }

    // 检查是否达到分享上限
    if (quota.shareCount >= config.maxShareBonusPerDay) {
      return {
        success: false,
        error: 'SHARE_LIMIT_REACHED',
        message: '今日分享次数已达上限'
      }
    }

    // 检查scene是否已存在（防刷）
    const existingShare = quota.shareDetails.find(s => s.scene === scene)
    if (existingShare) {
      return {
        success: false,
        error: 'DUPLICATE_SHARE',
        message: '该分享已记录'
      }
    }

    // 添加分享记录并增加奖励次数
    const newShareDetail = {
      shareTime: new Date(),
      scene: scene || `share_${Date.now()}`,
      type: type,
      isEffective: true
    }

    const newShareCount = quota.shareCount + 1
    const newBonusCount = quota.bonusCount + config.shareBonusPerTime

    await db.collection('daily_quota').doc(quota._id).update({
      data: {
        shareCount: newShareCount,
        bonusCount: newBonusCount,
        shareDetails: _.push(newShareDetail),
        isExhausted: quota.usedCount >= (quota.baseCount + newBonusCount),
        updateTime: new Date()
      }
    })

    // 记录到share_records集合
    try {
      await db.collection('share_records').add({
        data: {
          _openid: openid,
          scene: scene || `share_${Date.now()}`,
          type: type,
          date: today,
          bonusAdded: config.shareBonusPerTime,
          createTime: new Date()
        }
      })
    } catch (e) {
      console.log('记录分享日志失败:', e)
    }

    return {
      success: true,
      bonusAdded: config.shareBonusPerTime,
      totalBonus: newBonusCount,
      message: `获得${config.shareBonusPerTime}次取名宝宝机会`
    }

  } catch (err) {
    console.error('记录分享失败:', err)
    return {
      success: false,
      error: 'SYSTEM_ERROR',
      message: '系统错误，请稍后重试'
    }
  }
}
