// 简化版农历转换 - 仅用于八字计算
// 1900-2100年农历数据

// 农历数据：前16位为每年12个月的大小月（1大0小），后16位为闰月
// 数据格式：低16位 = 月份大小（bit0-11），高16位 = 闰月（bit12-15）月份和高16位 = 闰月大小
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d2, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0a570, 0x054e2, 0x0d160, 0x0e968, 0x0d520, 0x0daa0, 0x16aa6,
  0x056d0, 0x04ae0, 0x0a5d4, 0x0a2d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0,
  0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2,
  0x04970, 0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7,
  0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950,
  0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950,
  0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0a570, 0x054e2, 0x0d160, 0x0e968, 0x0d520, 0x0daa0,
  0x16aa6, 0x056d0, 0x04ae0, 0x0a5d4, 0x0a2d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2,
  0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570,
  0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0,
  0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2,
  0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8,
  0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0a570, 0x054e2, 0x0d160, 0x0e968, 0x0d520,
  0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a5d4, 0x0a2d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0
]

// 天干地支
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 五行
const WUXING_MAP = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
}

// 农历月份名称
const MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']

// 农历日期名称
const DAY_CN = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

// 公历转农历
function solarToLunar(year, month, day) {
  if (year < 1900 || year > 2100) {
    throw new Error('年份超出范围（1900-2100）')
  }

  // 计算从1900年1月31日（农历1900年正月初一）的天数
  const baseDate = new Date(1900, 0, 31)
  const targetDate = new Date(year, month - 1, day)
  let offset = Math.floor((targetDate - baseDate) / 86400000)

  // 查找农历年
  let lunarYear = 1900
  let i = 0
  let daysInYear = 0

  while (i < LUNAR_INFO.length && offset > 0) {
    daysInYear = getLunarYearDays(lunarYear)
    offset -= daysInYear

    if (offset < 0) {
      offset += daysInYear
      break
    }

    lunarYear++
    i++
  }

  // 查找农历月
  const info = LUNAR_INFO[i]
  const leapMonth = getLeapMonth(info)
  const leapMonthDays = leapMonth > 0 ? getLeapMonthDays(info) : 0

  let lunarMonth = 1
  let daysInMonth = 0
  let isLeap = false

  for (let m = 1; m <= 12; m++) {
    daysInMonth = getLunarMonthDays(info, m)

    // 处理闰月
    if (leapMonth > 0 && m === leapMonth + 1 && !isLeap) {
      lunarMonth--
      isLeap = true
      m--
      daysInMonth = leapMonthDays
      offset -= daysInMonth

      if (offset <= 0) {
        offset += daysInMonth
        break
      }
      continue
    }

    offset -= daysInMonth

    if (offset <= 0) {
      offset += daysInMonth
      break
    }

    lunarMonth++
  }

  const lunarDay = offset + 1

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeap,
    leapMonth
  }
}

// 获取农历年的总天数
function getLunarYearDays(year) {
  const i = year - 1900
  const info = LUNAR_INFO[i]
  let sum = 348

  for (let j = 0x8000; j > 0x8; j >>= 1) {
    sum += (info & j) ? 1 : 0
  }

  return sum + getLeapMonthDays(info)
}

// 获取闰月天数
function getLeapMonthDays(info) {
  const leapMonth = getLeapMonth(info)
  if (leapMonth > 0) {
    return (info & 0x10000) ? 30 : 29
  }
  return 0
}

// 获取闰哪个月（0表示无闰月）
function getLeapMonth(info) {
  return info >> 16 & 0xf
}

// 获取农历月的天数
function getLunarMonthDays(info, month) {
  return (info & (0x10000 >> month)) ? 30 : 29
}

// 获取年干支
function getYearGanZhi(year) {
  const offset = (year - 4) % 60
  const ganIndex = ((offset % 10) + 10) % 10
  const zhiIndex = ((offset % 12) + 12) % 12
  return GAN[ganIndex] + ZHI[zhiIndex]
}

// 获取月干支（基于节气简化）
function getMonthGanZhi(year, month) {
  const yearGan = GAN.indexOf(getYearGanZhi(year)[0])
  const startGanMap = [2, 4, 6, 8, 0]  // 丙戊庚壬甲
  const startGan = startGanMap[yearGan % 5]

  const monthZhiIndex = (month + 1) % 12
  const monthGanIndex = (startGan + month - 1) % 10

  return GAN[(monthGanIndex + 10) % 10] + ZHI[(monthZhiIndex + 12) % 12]
}

// 获取日干支
function getDayGanZhi(year, month, day) {
  const baseDate = new Date(1900, 0, 31)
  const targetDate = new Date(year, month - 1, day)
  const diffDays = Math.floor((targetDate - baseDate) / 86400000)

  const ganIndex = (diffDays + 40) % 10
  const zhiIndex = (diffDays + 20) % 12

  return GAN[(ganIndex + 10) % 10] + ZHI[(zhiIndex + 12) % 12]
}

// 获取时干支
function getHourGanZhi(dayGanZhi, hour) {
  const dayGan = dayGanZhi[0]
  const dayGanIndex = GAN.indexOf(dayGan)
  const shiChenIndex = Math.floor((hour + 1) / 2) % 12

  const startGanMap = [0, 2, 4, 6, 8]  // 甲丙戊庚壬
  const startGan = startGanMap[dayGanIndex % 5]
  const hourGanIndex = (startGan + shiChenIndex) % 10

  return GAN[(hourGanIndex + 10) % 10] + ZHI[(shiChenIndex + 12) % 12]
}

// 格式化农历日期
function formatLunar(lunarYear, lunarMonth, lunarDay, isLeap) {
  const month = MONTH_CN[lunarMonth - 1]
  const leap = isLeap ? '闰' : ''
  const day = DAY_CN[lunarDay - 1]
  const year = lunarYear.toString()
    .replace('0', '〇')
    .replace('1', '一')
    .replace('2', '二')
    .replace('3', '三')
    .replace('4', '四')
    .replace('5', '五')
    .replace('6', '六')
    .replace('7', '七')
    .replace('8', '八')
    .replace('9', '九')

  return `${year}年${leap}${month}月${day}`
}

module.exports = {
  solarToLunar,
  getYearGanZhi,
  getMonthGanZhi,
  getDayGanZhi,
  getHourGanZhi,
  formatLunar,
  WUXING_MAP,
  GAN,
  ZHI,
  ANIMALS
}
