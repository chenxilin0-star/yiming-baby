// 八字计算工具类
// 使用农历转换和天干地支计算

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const WUXING_MAP = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
}

const SHI_CHEN = [
  { name: '子时', range: '23:00-01:00', start: 23, end: 1 },
  { name: '丑时', range: '01:00-03:00', start: 1, end: 3 },
  { name: '寅时', range: '03:00-05:00', start: 3, end: 5 },
  { name: '卯时', range: '05:00-07:00', start: 5, end: 7 },
  { name: '辰时', range: '07:00-09:00', start: 7, end: 9 },
  { name: '巳时', range: '09:00-11:00', start: 9, end: 11 },
  { name: '午时', range: '11:00-13:00', start: 11, end: 13 },
  { name: '未时', range: '13:00-15:00', start: 13, end: 15 },
  { name: '申时', range: '15:00-17:00', start: 15, end: 17 },
  { name: '酉时', range: '17:00-19:00', start: 17, end: 19 },
  { name: '戌时', range: '19:00-21:00', start: 19, end: 21 },
  { name: '亥时', range: '21:00-23:00', start: 21, end: 23 }
]

class BaziCalculator {
  // 根据时间获取时辰
  static getShiChen(hour, minute = 0) {
    const totalMinutes = hour * 60 + minute
    
    for (let i = 0; i < SHI_CHEN.length; i++) {
      const sc = SHI_CHEN[i]
      const startMinutes = (sc.start === 23 ? 23 : sc.start) * 60
      const endMinutes = (sc.end === 1 ? 25 : sc.end) * 60
      
      if (sc.start === 23) {
        // 子时特殊处理 (23:00-01:00)
        if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) {
          return { index: i, ...sc }
        }
      } else {
        if (totalMinutes >= startMinutes && totalMinutes < endMinutes) {
          return { index: i, ...sc }
        }
      }
    }
    return { index: 0, ...SHI_CHEN[0] }
  }

  // 计算年柱
  static getYearPillar(year) {
    // 以1984年（甲子年）为基准
    const offset = (year - 1984) % 60
    const ganIndex = ((offset % 10) + 10) % 10
    const zhiIndex = ((offset % 12) + 12) % 12
    return {
      gan: TIAN_GAN[ganIndex],
      zhi: DI_ZHI[zhiIndex],
      wuxing: WUXING_MAP[TIAN_GAN[ganIndex]] + WUXING_MAP[DI_ZHI[zhiIndex]]
    }
  }

  // 计算月柱（简化版，以节气为界需要更精确的数据）
  static getMonthPillar(year, month) {
    // 年干决定月干起始
    const yearGanIndex = TIAN_GAN.indexOf(this.getYearPillar(year).gan)
    // 甲己之年丙作首，乙庚之岁戊为头，丙辛之岁寻庚起，丁壬壬位顺行流，戊癸何方发，甲寅之上好追求
    const startGanMap = [2, 4, 6, 8, 0] // 丙戊庚壬甲的索引
    const startGan = startGanMap[yearGanIndex % 5]
    
    // 正月建寅
    const monthZhiIndex = (month + 1) % 12 // 寅是索引2，正月对应寅
    const monthGanIndex = (startGan + month - 1) % 10
    
    return {
      gan: TIAN_GAN[monthGanIndex],
      zhi: DI_ZHI[monthZhiIndex],
      wuxing: WUXING_MAP[TIAN_GAN[monthGanIndex]] + WUXING_MAP[DI_ZHI[monthZhiIndex]]
    }
  }

  // 计算日柱（简化计算）
  static getDayPillar(year, month, day) {
    // 使用基准日期计算
    const baseDate = new Date(1900, 0, 31) // 1900年1月31日是甲子日
    const targetDate = new Date(year, month - 1, day)
    const diffDays = Math.floor((targetDate - baseDate) / (24 * 60 * 60 * 1000))
    
    const ganIndex = (diffDays % 10 + 10) % 10
    const zhiIndex = (diffDays % 12 + 12) % 12
    
    return {
      gan: TIAN_GAN[ganIndex],
      zhi: DI_ZHI[zhiIndex],
      wuxing: WUXING_MAP[TIAN_GAN[ganIndex]] + WUXING_MAP[DI_ZHI[zhiIndex]]
    }
  }

  // 计算时柱
  static getHourPillar(dayGan, hour, minute) {
    const shiChen = this.getShiChen(hour, minute)
    const dayGanIndex = TIAN_GAN.indexOf(dayGan)
    
    // 日干决定时干起始
    // 甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸何方发，壬子是真途
    const startGanMap = [0, 2, 4, 6, 8] // 甲丙戊庚壬的索引
    const startGan = startGanMap[dayGanIndex % 5]
    
    const hourGanIndex = (startGan + shiChen.index) % 10
    
    return {
      gan: TIAN_GAN[hourGanIndex],
      zhi: DI_ZHI[shiChen.index],
      wuxing: WUXING_MAP[TIAN_GAN[hourGanIndex]] + WUXING_MAP[DI_ZHI[shiChen.index]],
      shiChen: shiChen
    }
  }

  // 计算完整八字
  static calculate(year, month, day, hour, minute = 0) {
    const yearPillar = this.getYearPillar(year)
    const monthPillar = this.getMonthPillar(year, month)
    const dayPillar = this.getDayPillar(year, month, day)
    const hourPillar = this.getHourPillar(dayPillar.gan, hour, minute)

    // 计算五行分布
    const allGanZhi = [
      yearPillar.gan, yearPillar.zhi,
      monthPillar.gan, monthPillar.zhi,
      dayPillar.gan, dayPillar.zhi,
      hourPillar.gan, hourPillar.zhi
    ]
    
    const wuxingCount = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
    allGanZhi.forEach(char => {
      const wx = WUXING_MAP[char]
      if (wx) wuxingCount[wx]++
    })

    // 确定日主
    const dayMaster = dayPillar.gan + WUXING_MAP[dayPillar.gan]

    // 简单喜用神分析（基于五行缺失和日主）
    const xiyongshen = this.analyzeXiyongshen(dayMaster[1], wuxingCount)

    return {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
      wuxing: wuxingCount,
      dayMaster: dayMaster,
      xiyongshen: xiyongshen,
      lunarDate: this.toLunarDate(year, month, day)
    }
  }

  // 简化的农历转换（实际需要更精确的农历数据）
  static toLunarDate(year, month, day) {
    // 简化处理，实际需要农历库
    const ganZhiYear = this.getYearPillar(year)
    return `${ganZhiYear.gan}${ganZhiYear.zhi}年${month}月初${day}`
  }

  // 喜用神分析
  static analyzeXiyongshen(dayMasterWuxing, wuxingCount) {
    // 简化的喜用神分析逻辑
    const wuxingStrength = { ...wuxingCount }
    const total = Object.values(wuxingStrength).reduce((a, b) => a + b, 0)
    
    // 找最少的五行作为喜用
    let minCount = Infinity
    let xiyongshen = ''
    
    for (const [wx, count] of Object.entries(wuxingStrength)) {
      if (count < minCount && wx !== dayMasterWuxing) {
        minCount = count
        xiyongshen = wx
      }
    }

    // 如果某个五行完全缺失，优先作为喜用
    for (const [wx, count] of Object.entries(wuxingStrength)) {
      if (count === 0) {
        return wx
      }
    }

    return xiyongshen || '水'
  }

  // 获取五行颜色
  static getWuxingColor(wuxing) {
    const colorMap = {
      '金': '#d4af37',
      '木': '#5a9a5a',
      '水': '#4a90d9',
      '火': '#e74c3c',
      '土': '#8b7355'
    }
    return colorMap[wuxing] || '#8a8a8a'
  }
}

module.exports = BaziCalculator
