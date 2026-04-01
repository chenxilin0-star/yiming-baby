// 云函数：计算八字
const cloud = require('wx-server-sdk')
const { Solar, Lunar, LunarYear } = require('lunar-javascript')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const WUXING_MAP = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
}

exports.main = async (event, context) => {
  const { solarDate, solarTime } = event

  if (!solarDate || !solarTime) {
    return {
      success: false,
      error: 'INVALID_PARAMS',
      message: '缺少必要参数'
    }
  }

  try {
    const [year, month, day] = solarDate.split('-').map(Number)
    const [hour, minute] = solarTime.split(':').map(Number)

    console.log('========== 八字计算 ==========')
    console.log('公历:', year, month, day, hour, minute)

    // 使用 lunar-javascript 库转换
    // 先创建 Solar 对象（阳历）
    // 注意：Solar.fromYmd 的月份参数是 1-12，不是 0-11
    const solar = Solar.fromYmd(year, month, day)

    // 转换成 Lunar 对象（阴历）
    const lunar = solar.getLunar()

    console.log('农历年份:', lunar.getYear())
    console.log('农历月份:', lunar.getMonth())
    console.log('农历日期:', lunar.getDay())

    // 获取闰月信息
    const lunarYearObj = LunarYear.fromYear(year)
    const leapMonth = lunarYearObj.getLeapMonth()
    console.log('是否闰月:', leapMonth > 0 && lunar.getMonth() === leapMonth)

    // 获取八字
    const yearGanZhi = lunar.getYearInGanZhi()  // 年柱
    const monthGanZhi = lunar.getMonthInGanZhi() // 月柱
    const dayGanZhi = lunar.getDayInGanZhi()  // 日柱
    const hourGanZhi = lunar.getTimeInGanZhi(hour)  // 时柱（需要传入小时）

    console.log('年柱:', yearGanZhi)
    console.log('月柱:', monthGanZhi)
    console.log('日柱:', dayGanZhi)
    console.log('时柱:', hourGanZhi)
    console.log('农历完整:', lunar.toString())

    // 解析干支
    const yearGan = yearGanZhi.substring(0, 1)
    const yearZhi = yearGanZhi.substring(1, 2)
    const monthGan = monthGanZhi.substring(0, 1)
    const monthZhi = monthGanZhi.substring(1, 2)
    const dayGan = dayGanZhi.substring(0, 1)
    const dayZhi = dayGanZhi.substring(1, 2)
    const hourGan = hourGanZhi.substring(0, 1)
    const hourZhi = hourGanZhi.substring(1, 2)

    // 计算五行分布
    const allGanZhi = [
      yearGan, yearZhi,
      monthGan, monthZhi,
      dayGan, dayZhi,
      hourGan, hourZhi
    ]

    const wuxingCount = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
    allGanZhi.forEach(char => {
      const wx = WUXING_MAP[char]
      if (wx) wuxingCount[wx]++
    })

    console.log('五行统计:', wuxingCount)

    // 确定日主（日干）
    const dayMaster = dayGan + WUXING_MAP[dayGan]

    // 喜用神分析
    const xiyongshen = analyzeXiyongshen(dayGan, wuxingCount, WUXING_MAP)

    console.log('日主:', dayMaster)
    console.log('喜用神:', xiyongshen)

    // 格式化农历日期显示
    const lunarDateStr = `${lunar.getYearInChinese()}${lunar.getMonthInChinese()}${lunar.getDayInChinese()}`

    // 获取时辰名称
    const shichenList = [
      { name: '子时', range: '23:00-01:00' },
      { name: '丑时', range: '01:00-03:00' },
      { name: '寅时', range: '03:00-05:00' },
      { name: '卯时', range: '05:00-07:00' },
      { name: '辰时', range: '07:00-09:00' },
      { name: '巳时', range: '09:00-11:00' },
      { name: '午时', range: '11:00-13:00' },
      { name: '未时', range: '13:00-15:00' },
      { name: '申时', range: '15:00-17:00' },
      { name: '酉时', range: '17:00-19:00' },
      { name: '戌时', range: '19:00-21:00' },
      { name: '亥时', range: '21:00-23:00' }
    ]
    const shichenIndex = Math.floor((hour + 1) / 2) % 12
    const shichen = shichenList[shichenIndex < 0 ? 11 : shichenIndex]

    return {
      success: true,
      bazi: {
        year: { gan: yearGan, zhi: yearZhi, wuxing: WUXING_MAP[yearGan] + WUXING_MAP[yearZhi] },
        month: { gan: monthGan, zhi: monthZhi, wuxing: WUXING_MAP[monthGan] + WUXING_MAP[monthZhi] },
        day: { gan: dayGan, zhi: dayZhi, wuxing: WUXING_MAP[dayGan] + WUXING_MAP[dayZhi] },
        hour: { gan: hourGan, zhi: hourZhi, wuxing: WUXING_MAP[hourGan] + WUXING_MAP[hourZhi] },
        wuxing: wuxingCount,
        dayMaster: dayMaster,
        xiyongshen: xiyongshen,
        lunarDate: lunarDateStr,
        solarDate: `${year}年${month}月${day}日`,
        solarTime: `${hour}:${String(minute).padStart(2, '0')}`,
        shichen: shichen.name
      }
    }

  } catch (err) {
    console.error('计算八字失败:', err)
    return {
      success: false,
      error: 'CALCULATION_ERROR',
      message: '八字计算失败'
    }
  }
}

// 喜用神分析
function analyzeXiyongshen(dayGan, wuxingCount, WUXING_MAP) {
  const dayWuxing = WUXING_MAP[dayGan]

  // 找出最少的五行（缺失的五行优先）
  const sortedWuxing = Object.entries(wuxingCount)
    .sort((a, b) => a[1] - b[1])

  // 优先选择缺失的五行
  for (const [wx, count] of sortedWuxing) {
    if (count === 0 && wx !== dayWuxing) {
      return wx
    }
  }

  // 如果没有缺失，选择最少的
  for (const [wx, count] of sortedWuxing) {
    if (wx !== dayWuxing) {
      return wx
    }
  }

  return '水'
}
