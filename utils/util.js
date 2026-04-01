// 通用工具函数

/**
 * 格式化日期
 * @param {Date} date 
 * @param {string} format 
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
}

/**
 * 格式化时间戳为相对时间
 * @param {number} timestamp 
 */
function formatRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return formatDate(new Date(timestamp))
  }
}

/**
 * 防抖函数
 * @param {Function} func 
 * @param {number} wait 
 */
function debounce(func, wait = 300) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

/**
 * 节流函数
 * @param {Function} func 
 * @param {number} limit 
 */
function throttle(func, limit = 300) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 显示加载提示
 * @param {string} title 
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 显示成功提示
 * @param {string} title 
 * @param {number} duration 
 */
function showSuccess(title, duration = 1500) {
  wx.showToast({
    title,
    icon: 'success',
    duration
  })
}

/**
 * 显示错误提示
 * @param {string} title 
 * @param {number} duration 
 */
function showError(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'error',
    duration
  })
}

/**
 * 显示模态对话框
 * @param {string} title 
 * @param {string} content 
 */
function showModal(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 复制到剪贴板
 * @param {string} data 
 */
function copyToClipboard(data) {
  wx.setClipboardData({
    data,
    success: () => {
      showSuccess('已复制')
    }
  })
}

/**
 * 保存图片到相册
 * @param {string} filePath 
 */
function saveImageToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          showModal('需要权限', '需要授权保存到相册才能保存图片')
            .then((confirm) => {
              if (confirm) {
                wx.openSetting()
              }
            })
        } else {
          showError('保存失败')
        }
        reject(err)
      }
    })
  })
}

/**
 * 下载文件
 * @param {string} url 
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath)
        } else {
          reject(new Error(`下载失败: ${res.statusCode}`))
        }
      },
      fail: reject
    })
  })
}

/**
 * 获取系统信息
 */
function getSystemInfo() {
  return wx.getSystemInfoSync()
}

/**
 * 检查网络状态
 */
function checkNetwork() {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: (res) => {
        resolve(res.networkType !== 'none')
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 安全获取嵌套对象属性
 * @param {object} obj 
 * @param {string} path 
 * @param {*} defaultValue 
 */
function get(obj, path, defaultValue = undefined) {
  const keys = path.split('.')
  let result = obj
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue
    }
    result = result[key]
  }
  
  return result !== undefined ? result : defaultValue
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 休眠函数
 * @param {number} ms 
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 随机打乱数组
 * @param {Array} array 
 */
function shuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

module.exports = {
  formatDate,
  formatRelativeTime,
  debounce,
  throttle,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showModal,
  copyToClipboard,
  saveImageToAlbum,
  downloadFile,
  getSystemInfo,
  checkNetwork,
  get,
  generateId,
  sleep,
  shuffle
}
