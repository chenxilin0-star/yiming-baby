// 云函数：检查并消耗次数（原子操作）
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

  // 调试：输出完整的 wxContext
  console.log('========== wxContext 调试信息 ==========')
  console.log('OPENID:', wxContext.OPENID)
  console.log('APPID:', wxContext.APPID)
  console.log('UNIONID:', wxContext.UNIONID)
  console.log('CLIENTIP:', wxContext.CLIENTIP)
  console.log('=====================================')

  let openid = wxContext.OPENID
  const { type = 'free' } = event

  // ⚠️ 开发环境临时方案：如果没有 openid，使用设备 ID
  // 注意：这个方案仅用于开发测试，生产环境必须移除！
  if (!openid) {
    console.log('⚠️ 警告：未获取到 openid，使用设备标识（开发模式）')
    console.log('完整 event 数据:', JSON.stringify(event))

    // 尝试从 event 中获取客户端标识
    const clientIP = context.CLIENTIP || context.clientIP || 'unknown'
    const appId = wxContext.APPID || 'unknown'

    // 使用设备标识作为临时 ID（开发环境专用）
    openid = `dev_${appId}_${clientIP}`

    console.log('⚠️ 使用临时设备 ID:', openid)
    console.log('⚠️ 提示：请在真机或已登录的模拟器中测试！')
  }

  const userId = openid
  console.log('✓ 用户ID:', userId)

  try {
    const today = getTodayString()
    console.log('========== checkAndUseQuota ==========')
    console.log('今日日期:', today)

    // 先查询当前配额
    const quotaRes = await db.collection('daily_quota')
      .where({
        _openid: userId,
        date: today
      })
      .get()

    console.log('查询结果数量:', quotaRes.data.length)

    let quota

    if (quotaRes.data.length === 0) {
      // 自动创建配额记录
      console.log('创建新配额记录')
      quota = {
        _openid: userId,
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
      const addRes = await db.collection('daily_quota').add({ data: quota })
      quota._id = addRes._id
      console.log('创建成功, _id:', quota._id)
    } else {
      quota = quotaRes.data[0]
      console.log('找到配额记录, _id:', quota._id)
    }
    const total = quota.baseCount + quota.bonusCount
    console.log('配额状态 - usedCount:', quota.usedCount, 'total:', total)

    // 检查是否有剩余次数
    if (quota.usedCount >= total) {
      console.log('✗ 配额已用完')
      return {
        success: false,
        error: 'QUOTA_EXHAUSTED',
        message: '今日次数已用完'
      }
    }

    // 原子性增加已使用次数
    console.log('开始更新 usedCount + 1')
    const updateRes = await db.collection('daily_quota').doc(quota._id).update({
      data: {
        usedCount: _.inc(1),
        isExhausted: quota.usedCount + 1 >= total,
        updateTime: new Date()
      }
    })
    console.log('更新结果, stats:', JSON.stringify(updateRes.stats))

    if (updateRes.stats.updated === 0) {
      console.log('✗ 更新失败，updated 为 0')
      return {
        success: false,
        error: 'UPDATE_FAILED',
        message: '更新失败，请重试'
      }
    }

    // 获取更新后的配额
    const updatedQuota = await db.collection('daily_quota').doc(quota._id).get()
    const newQuota = updatedQuota.data
    const remaining = newQuota.baseCount + newQuota.bonusCount - newQuota.usedCount

    console.log('✓ 配额更新成功 | usedCount:', newQuota.usedCount, '| 剩余:', remaining)

    return {
      success: true,
      remaining: Math.max(0, remaining),
      quotaId: quota._id
    }

  } catch (err) {
    console.error('消耗次数失败:', err)
    return {
      success: false,
      error: 'SYSTEM_ERROR',
      message: '系统错误，请稍后重试'
    }
  }
}
