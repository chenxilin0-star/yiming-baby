// 云函数：分析已有名字
const cloud = require('wx-server-sdk')
const { Solar, Lunar, LunarYear } = require('lunar-javascript')
const pinyin = require('pinyin')
const { getCharWuxing: getWuxingFromData, getCharStrokes: getStrokesFromData } = require('./hanziData.js')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const WUXING_MAP = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
}

// 获取今天的日期字符串
function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { surname, name, solarDate, solarTime, gender } = event

  if (!surname || !name || !solarDate || !solarTime) {
    return {
      success: false,
      error: 'INVALID_PARAMS',
      message: '缺少必要参数'
    }
  }

  try {
    // 1. 先检查并消耗次数（直接操作数据库）
    console.log('========== 开始检查并消耗配额 ==========')
    console.log('OPENID:', openid)

    if (!openid) {
      console.log('✗ 用户未登录')
      return {
        success: false,
        error: 'NOT_LOGGED_IN',
        message: '请先登录后再使用'
      }
    }

    const today = getTodayString()
    console.log('今日日期:', today)

    // 查询今日配额记录
    const quotaRes = await db.collection('daily_quota')
      .where({
        _openid: openid,
        date: today
      })
      .get()

    let quota
    if (quotaRes.data.length === 0) {
      // 创建新配额记录
      console.log('创建新配额记录')
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
      const addRes = await db.collection('daily_quota').add({ data: quota })
      quota._id = addRes._id
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

    const remaining = total - (quota.usedCount + 1)
    console.log('✓ 配额消耗成功 | 剩余次数:', remaining)
    const quotaId = quota._id

    const [year, month, day] = solarDate.split('-').map(Number)
    const [hour, minute] = solarTime.split(':').map(Number)

    console.log('========== 名字分析 ==========')
    console.log('姓氏:', surname)
    console.log('名字:', name)
    console.log('公历:', year, month, day, hour, minute)
    console.log('性别:', gender === 1 ? '男' : '女')

    // 使用 lunar-javascript 库转换
    const solar = Solar.fromYmd(year, month, day)
    const lunar = solar.getLunar()

    console.log('农历年份:', lunar.getYear())
    console.log('农历月份:', lunar.getMonth())
    console.log('农历日期:', lunar.getDay())

    // 获取闰月信息
    const lunarYearObj = LunarYear.fromYear(year)
    const leapMonth = lunarYearObj.getLeapMonth()

    // 获取八字
    const yearGanZhi = lunar.getYearInGanZhi()  // 年柱
    const monthGanZhi = lunar.getMonthInGanZhi() // 月柱
    const dayGanZhi = lunar.getDayInGanZhi()  // 日柱
    const hourGanZhi = lunar.getTimeInGanZhi(hour)  // 时柱

    console.log('年柱:', yearGanZhi)
    console.log('月柱:', monthGanZhi)
    console.log('日柱:', dayGanZhi)
    console.log('时柱:', hourGanZhi)

    // 解析干支
    const yearGan = yearGanZhi.substring(0, 1)
    const yearZhi = yearGanZhi.substring(1, 2)
    const monthGan = monthGanZhi.substring(0, 1)
    const monthZhi = monthGanZhi.substring(1, 2)
    const dayGan = dayGanZhi.substring(0, 1)
    const dayZhi = dayGanZhi.substring(1, 2)
    const hourGan = hourGanZhi.substring(0, 1)
    const hourZhi = hourGanZhi.substring(1, 2)

    // 计算名字的五行分布
    const fullName = surname + name
    const nameChars = fullName.split('')

    const nameWuxingCount = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
    nameChars.forEach(char => {
      const wx = getWuxingFromData(char)
      if (wx) nameWuxingCount[wx]++
    })

    console.log('名字五行统计:', nameWuxingCount)

    // 计算五格（天格、地格、人格、外格、总格）
    const wuge = calculateWuge(surname, name)

    // 分析五行平衡
    const wuxingAnalysis = analyzeWuxingBalance(nameWuxingCount, dayGan, WUXING_MAP)

    // 综合评分
    const score = calculateScore(wuge, wuxingAnalysis, nameWuxingCount)

    // 生成建议
    const suggestions = generateSuggestions(wuge, wuxingAnalysis, dayGan)

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

    // 保存分析记录
    const recordData = {
      _openid: openid,
      type: 'analyze',
      input: {
        surname,
        name,
        fullName,
        gender,
        solarDate,
        solarTime
      },
      result: {
        bazi: {
          year: { gan: yearGan, zhi: yearZhi, wuxing: WUXING_MAP[yearGan] + WUXING_MAP[yearZhi] },
          month: { gan: monthGan, zhi: monthZhi, wuxing: WUXING_MAP[monthGan] + WUXING_MAP[monthZhi] },
          day: { gan: dayGan, zhi: dayZhi, wuxing: WUXING_MAP[dayGan] + WUXING_MAP[dayZhi] },
          hour: { gan: hourGan, zhi: hourZhi, wuxing: WUXING_MAP[hourGan] + WUXING_MAP[hourZhi] },
          wuxing: nameWuxingCount,
          dayMaster: dayGan + WUXING_MAP[dayGan],
          xiyongshen: analyzeXiyongshen(dayGan, nameWuxingCount, WUXING_MAP),
          lunarDate: lunarDateStr,
          solarDate: `${year}年${month}月${day}日`,
          solarTime: `${hour}:${String(minute).padStart(2, '0')}`,
          shichen: shichen.name
        },
        wuge,
        wuxingAnalysis,
        score,
        suggestions
      },
      costType: 'free',
      costQuotaId: quotaId,
      createTime: new Date()
    }

    try {
      await db.collection('analyze_records').add({
        data: recordData
      })
      console.log('✓ 保存分析记录成功')
    } catch (err) {
      console.error('✗ 保存分析记录失败:', err)

      // 回滚已消耗的次数
      try {
        console.log('开始回滚配额, quotaId:', quotaId)
        await db.collection('daily_quota').doc(quotaId).update({
          data: {
            usedCount: _.inc(-1),
            isExhausted: false,
            updateTime: new Date()
          }
        })
        console.log('✓ 已回滚消耗的次数')
      } catch (rollbackErr) {
        console.error('✗ 回滚次数失败:', rollbackErr)
      }

      // 仍然返回成功结果（分析已完成，只是保存失败）
    }

    return {
      success: true,
      input: {
        surname,
        name,
        fullName,
        gender
      },
      bazi: {
        year: { gan: yearGan, zhi: yearZhi, wuxing: WUXING_MAP[yearGan] + WUXING_MAP[yearZhi] },
        month: { gan: monthGan, zhi: monthZhi, wuxing: WUXING_MAP[monthGan] + WUXING_MAP[monthZhi] },
        day: { gan: dayGan, zhi: dayZhi, wuxing: WUXING_MAP[dayGan] + WUXING_MAP[dayZhi] },
        hour: { gan: hourGan, zhi: hourZhi, wuxing: WUXING_MAP[hourGan] + WUXING_MAP[hourZhi] },
        wuxing: nameWuxingCount,
        dayMaster: dayGan + WUXING_MAP[dayGan],
        xiyongshen: analyzeXiyongshen(dayGan, nameWuxingCount, WUXING_MAP),
        lunarDate: lunarDateStr,
        solarDate: `${year}年${month}月${day}日`,
        solarTime: `${hour}:${String(minute).padStart(2, '0')}`,
        shichen: shichen.name
      },
      wuge,
      wuxingAnalysis,
      score,
      suggestions
    }

  } catch (err) {
    console.error('名字分析失败:', err)
    return {
      success: false,
      error: 'ANALYSIS_ERROR',
      message: '名字分析失败'
    }
  }
}

// 分析五行平衡
function analyzeWuxingBalance(nameWuxingCount, dayGan, WUXING_MAP) {
  const dayWuxing = WUXING_MAP[dayGan]
  const wuxingList = ['金', '木', '水', '火', '土']

  // 找出最多的五行
  let maxCount = 0
  let maxWuxing = ''
  wuxingList.forEach(wx => {
    if (nameWuxingCount[wx] > maxCount) {
      maxCount = nameWuxingCount[wx]
      maxWuxing = wx
    }
  })

  // 判断五行是否平衡
  const wuxingScores = wuxingList.map(wx => nameWuxingCount[wx])
  const hasWuxing = wuxingScores.filter(s => s > 0).length

  let balance, advice
  if (hasWuxing <= 2) {
    balance = '五行不全'
    advice = `名字中只包含${hasWuxing}种五行，建议补充缺失的五行以平衡命理`
  } else if (maxCount >= 4) {
    balance = '五行偏重'
    advice = `"${maxWuxing}行过多(${maxCount}个），可能导致性格过于${maxWuxing === '金' ? '刚硬' : maxWuxing === '木' ? '固执' : maxWuxing === '水' ? '多变' : maxWuxing === '火' ? '急躁' : '固执'}`
  } else {
    balance = '五行平衡'
    advice = '五行分布较为均衡，有利于性格发展和运势'
  }

  return {
    nameWuxingCount,
    maxWuxing,
    maxCount,
    hasWuxing,
    balance,
    advice,
    dayWuxing,
    isDayWuxingInName: nameWuxingCount[dayWuxing] > 0
  }
}

// 计算五格
function calculateWuge(surname, name) {
  const surnameStrokes = getSurnameStrokes(surname)

  // 名字笔画
  const nameStrokes = name.split('').map(char => getStrokesFromData(char))

  // 天格：姓氏+1
  const tiange = surnameStrokes + 1

  // 人格：姓氏+名首字
  const renge = surnameStrokes + nameStrokes[0]

  // 地格：名字各字笔画相加
  const dige = nameStrokes.reduce((sum, s) => sum + s, 0)

  // 外格：名末字+1
  const waige = nameStrokes[nameStrokes.length - 1] + 1

  // 总格：姓氏+名字总笔画
  const zongge = surnameStrokes + dige

  return {
    tiange: { num: tiange, wuxing: getWuxingByNum(tiange), jixiong: getJixiong(tiange, '天格') },
    renge: { num: renge, wuxing: getWuxingByNum(renge), jixiong: getJixiong(renge, '人格') },
    dige: { num: dige, wuxing: getWuxingByNum(dige), jixiong: getJixiong(dige, '地格') },
    waige: { num: waige, wuxing: getWuxingByNum(waige), jixiong: getJixiong(waige, '外格') },
    zongge: { num: zongge, wuxing: getWuxingByNum(zongge), jixiong: getJixiong(zongge, '总格') }
  }
}

// 获取姓氏笔画
function getSurnameStrokes(surname) {
  const commonSurnames = {
    '王': 4, '李': 7, '张': 7, '刘': 6, '陈': 7, '杨': 7,
    '赵': 9, '黄': 11, '周': 8, '吴': 7, '徐': 10,
    '孙': 6, '胡': 9, '朱': 6, '高': 10, '林': 8,
    '郭': 10, '马': 3, '梁': 11, '宋': 7, '郑': 8,
    '谢': 12, '韩': 12, '唐': 10, '冯': 5, '于': 3,
    '董': 15, '萧': 18, '程': 12, '曹': 11, '袁': 10,
    '邓': 19, '许': 11, '傅': 12, '沈': 7, '曾': 12,
    '彭': 12, '吕': 7, '苏': 7, '卢': 16, '蒋': 13,
    '蔡': 17, '贾': 13, '丁': 2, '魏': 17, '薛': 16
  }
  return commonSurnames[surname] || 6
}

// 根据数字获取五行
function getWuxingByNum(num) {
  const wuxingMap = {
    1: '木', 2: '木', 3: '火', 4: '火', 5: '土',
    6: '土', 7: '金', 8: '金', 9: '水', 0: '水'
  }
  return wuxingMap[num % 10] || '水'
}

// 判断吉凶
function getJixiong(num, type) {
  // 大吉数字
  const luckyNums = [1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 21, 23, 24, 25, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 63, 65, 67, 81]

  if (luckyNums.includes(num)) return '吉'
  if (num === 2 || num === 4 || num === 9 || num === 10 || num === 12) return '凶'
  return '中'
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
    if (count === 1 && wx !== dayWuxing) {
      return wx
    }
  }

  return '水'
}

// 计算综合评分
function calculateScore(wuge, wuxingAnalysis, nameWuxingCount) {
  let score = 0 // 从0分开始

  // 五格评分（每个最多10分，共4格最多40分）
  const wugeItems = [wuge.tiange, wuge.renge, wuge.dige, wuge.zongge, wuge.waige]
  wugeItems.forEach(item => {
    if (item.jixiong === '吉') score += 10
    else if (item.jixiong === '中') score += 5
    // 凶不加分
  })

  // 五行平衡评分（最多20分）
  if (wuxingAnalysis.balance === '五行平衡') score += 20
  else if (wuxingAnalysis.balance === '五行偏重') score += 10
  else if (wuxingAnalysis.balance === '五行不全') score += 5

  // 五行完整度评分（最多15分）
  if (wuxingAnalysis.hasWuxing >= 5) score += 15
  else if (wuxingAnalysis.hasWuxing >= 4) score += 10
  else if (wuxingAnalysis.hasWuxing >= 3) score += 5
  // 1-2种五行不加分

  // 日主五行在名字中（10分）
  if (wuxingAnalysis.isDayWuxingInName) score += 10

  // 凶格惩罚（每个凶格扣5分，最多扣20分）
  const badCount = wugeItems.filter(item => item.jixiong === '凶').length
  score -= badCount * 5

  return Math.min(100, Math.max(0, score))
}

// 生成建议
function generateSuggestions(wuge, wuxingAnalysis, dayGan) {
  const suggestions = []

  // 五格建议
  if (wuge.tiange.jixiong === '凶') {
    suggestions.push('天格为凶，建议在名字后加一个字以改善天格')
  }
  if (wuge.renge.jixiong === '凶') {
    suggestions.push('人格为凶，建议调整名字首字')
  }
  if (wuge.dige.jixiong === '凶') {
    suggestions.push('地格为凶，建议调整名字组合')
  }

  // 五行建议
  if (wuxingAnalysis.balance === '五行不全') {
    suggestions.push(`建议补充缺失的五行，以平衡命理`)
  }
  if (wuxingAnalysis.balance === '五行偏重') {
    suggestions.push(`"${wuxingAnalysis.maxWuxing}行过多，建议增加其他五行以平衡`)
  }

  // 综合建议
  if (suggestions.length === 0) {
    suggestions.push('名字整体较好，可继续使用')
    suggestions.push('如需改善，可考虑调整单个字的五行组合')
  }

  return suggestions
}
