// 云函数：获取收藏列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { page = 1, pageSize = 20 } = event

  if (!openid) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: '用户未登录'
    }
  }

  try {
    const skip = (page - 1) * pageSize

    const favRes = await db.collection('favorites')
      .where({
        _openid: openid
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countRes = await db.collection('favorites')
      .where({ _openid: openid })
      .count()

    return {
      success: true,
      list: favRes.data,
      total: countRes.total,
      page,
      pageSize,
      hasMore: skip + favRes.data.length < countRes.total
    }

  } catch (err) {
    console.error('获取收藏失败:', err)
    return {
      success: false,
      error: 'SYSTEM_ERROR',
      message: '获取收藏失败'
    }
  }
}
