// 云函数：切换收藏状态
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { recordId, name, action, nameData } = event

  if (!openid) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: '用户未登录'
    }
  }

  if (!recordId || !name) {
    return {
      success: false,
      error: 'INVALID_PARAMS',
      message: '缺少必要参数'
    }
  }

  try {
    // 检查是否已收藏
    const favRes = await db.collection('favorites')
      .where({
        _openid: openid,
        recordId: recordId,
        name: name
      })
      .get()

    const isFavorited = favRes.data.length > 0

    if (action === 'remove' || (action === 'toggle' && isFavorited)) {
      // 取消收藏
      if (isFavorited) {
        await db.collection('favorites').doc(favRes.data[0]._id).remove()
      }
      return {
        success: true,
        isFavorite: false,
        message: '已取消收藏'
      }
    } else {
      // 添加收藏
      if (!isFavorited) {
        const favData = {
          _openid: openid,
          recordId: recordId,
          name: name,
          score: nameData?.score || 0,
          wuxing: nameData?.wuxing || '',
          interpretation: nameData?.interpretation || '',
          createTime: new Date()
        }
        await db.collection('favorites').add({
          data: favData
        })
      }
      return {
        success: true,
        isFavorite: true,
        message: '收藏成功'
      }
    }

  } catch (err) {
    console.error('切换收藏失败:', err)
    return {
      success: false,
      error: 'SYSTEM_ERROR',
      message: '操作失败，请稍后重试'
    }
  }
}
