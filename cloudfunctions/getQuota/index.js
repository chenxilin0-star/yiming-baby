// 云函数：获取用户今日次数配额
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 获取今天的日期字符串
function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// 获取系统配置
async function getSystemConfig() {
  try {
    const { data } = await db.collection('system_config').doc('quota_rules').get()
    return data
  } catch (err) {
    // 返回默认配置
    return {
      baseDailyCount: 1,
      maxDailyCount: 3,
      shareBonusPerTime: 1,
      maxShareBonusPerDay: 2
    }
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let openid = wxContext.OPENID

  console.log('========== getQuota 调试信息 ==========')
  console.log('OPENID:', openid)

  // ⚠️ 开发环境临时方案：如果没有 openid，使用固定的设备 ID
  if (!openid) {
    const clientIP = context.CLIENTIP || context.clientIP || 'unknown'
    const appId = wxContext.APPID || 'unknown'
    openid = `dev_${appId}_${clientIP}`
    console.log('⚠️ 使用临时设备 ID:', openid)
  }

  const userId = openid
  console.log('✓ 用户ID:', userId)

  try {
    const today = getTodayString()
    const config = await getSystemConfig()

    // 查询今日配额记录
    let quotaRes = await db.collection('daily_quota')
      .where({
        _openid: userId,
        date: today
      })
      .get()

    let quota

    if (quotaRes.data.length === 0) {
      // 创建新的配额记录
      quota = {
        _openid: userId,
        date: today,
        dateObj: new Date(),
        baseCount: config.baseDailyCount,
        usedCount: 0,
        shareCount: 0,
        bonusCount: 0,
        shareDetails: [],
        isExhausted: false,
        createTime: new Date(),
        updateTime: new Date()
      }
      
      await db.collection('daily_quota').add({
        data: quota
      })
    } else {
      quota = quotaRes.data[0]
    }

    // 计算剩余次数
    const total = quota.baseCount + quota.bonusCount
    const remaining = Math.max(0, total - quota.usedCount)
    const canShare = quota.shareCount < config.maxShareBonusPerDay
    const maxShareBonus = Math.max(0, config.maxShareBonusPerDay - quota.shareCount)

    return {
      success: true,
      remaining,
      total,
      used: quota.usedCount,
      canShare,
      maxShareBonus,
      quotaId: quota._id
    }

  } catch (err) {
    console.error('获取配额失败:', err)
    return {
      success: false,
      error: 'SYSTEM_ERROR',
      message: '系统错误，请稍后重试'
    }
  }
}
