// 云函数：取名宝宝核心
const cloud = require('wx-server-sdk')
const { Solar, Lunar, LunarYear } = require('lunar-javascript')
const pinyin = require('pinyin')
const { JIN_ZI, MU_ZI, SHUI_ZI, HUO_ZI, TU_ZI, WUGE_JIXIONG } = require('./hanziData.js')

// 字库
const ALL_DATA = {
  '金': { ...JIN_ZI },
  '木': { ...MU_ZI },
  '水': { ...SHUI_ZI },
  '火': { ...HUO_ZI },
  '土': { ...TU_ZI }
}

// 禁用做人名的字（含义不雅或有不祥寓意）
const FORBIDDEN_CHARS = new Set([
  // 武器/战争
  '戈', '战', '辟', '戎', '械', '刀', '刃', '矛', '戟', '弓', '弩', '箭', '镖', '剑', '戟', '盾', '矛', '枪', '炮', '弹', '硫', '硝', '磺',
  // 贬义/负面
  '辩', '锒', '坏', '贼', '窃', '盗', '骗', '拐', '劣', '笨', '蠢', '傻', '丑', '辱', '骂', '讽', '刺', '讥', '诽', '谤', '诬', '害', '残', '忍', '狠', '滑', '狡', '诈', '伪', '虚', '假', '骗', '哄', '骗',
  // 不吉利
  '坟', '墓', '尸', '殡', '毙', '祭', '祀', '丧', '哀', '悲', '哭', '涕', '泣', '泪', '嚎', '嘶', '吼', '啸', '哀', '惨', '伤', '痛', '苦', '难', '祸', '灾', '凶', '煞', '劫', '难',
  // 疾病/灾祸
  '疾', '病', '瘟', '疫', '癌', '魔', '鬼', '妖', '邪', '怪', '凶', '杀', '斩', '屠', '刑', '狱', '罚', '罪', '惩', '痨', '瘸', '瘫', '瞎', '聋', '哑', '疤', '疮', '疣', '痔', '疖', '痣', '瘟', '痴', '呆', '傻', '疯', '痫', '眩', '晕',
  // 自然灾害/不雅
  '焚', '烧', '焦', '枯', '朽', '腐', '臭', '秽', '淫', '赌', '毒', '淹', '溺', '渍', '垢', '垃', '圾', '泥', '浊', '污', '脏', '秽', '漏', '渗', '泡', '浸', '浸', '淹', '灌',
  // 不常用/生僻字（不适合做名字）
  '算', '输', '键', '锡', '镐', '镁', '钠', '铝', '铜', '铁', '锣', '镣', '铛', '闩', '闸', '阀', '阀', '闘', '阮', '隽', '雠', '靼', '鼐', '翦', '颛', '饕', '餍', '髑', '髓', '髓',
  // 谐音/歧义（常见不雅谐音）
  '翔', '榴', '莲', '茂', '需', '表', '号', '瓜', '飘', '漂', '赌', '毒', '萎', '衰', '败', '落', '凋', '谢', '零', '凋', '衰', '萎', '哀', '衰',
  // 器物/工具（不够雅致）
  '锤', '钉', '锁', '链', '钩', '叉', '斧', '锯', '刨', '磨', '碾', '磨', '盆', '碗', '碟', '盘', '桶', '盆', '缸', '罐', '壶', '瓶', '杯', '盏', '勺', '匕', '匙', '筷', '刀', '叉', '剪', '针', '线', '绳', '网', '袋', '囊'
])

// 常见姓氏（不适合出现在名字第二位）
const COMMON_SURNAMES = new Set([
  '陈', '李', '张', '刘', '王', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '姜', '汤', '夏', '殷', '罗', '毕', '郝', '孔', '邵', '史', '顾', '侯', '孟', '龙', '万', '段', '雷', '钱', '尹', '黎', '易', '常', '武', '乔', '贺', '龚', '庞', '莫', '江', '熊', '秦', '邱', '纪', '施', '牛', '洪', '裴', '翁', '阮', '欧', '党', '代', '阳', '冀', '谈', '劳', '顾', '尤', '蓝', '闵', '季', '欧阳', '杨', '柳', '苏', '潘', '葛', '奚', '范', '彭', '郎', '鲁', '韦', '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳', '酆', '鲍', '史', '唐', '费', '廉', '岑', '薛', '雷', '贺', '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常', '乐', '于', '时', '傅', '皮', '卞', '齐', '康', '伍', '余', '元', '卜', '顾', '孟', '平', '黄', '和', '穆', '萧', '尹', '姚', '邵', '湛', '汪', '祁', '毛', '禹', '狄', '米', '贝', '明', '臧', '计', '伏', '成', '戴', '谈', '宋', '茅', '庞', '熊', '纪', '舒', '屈', '项', '祝', '董', '梁', '杜', '阮', '蓝', '闵', '席', '季', '麻', '强', '贾', '路', '娄', '危', '江', '童', '颜', '郭', '梅', '盛', '林', '刁', '钟', '徐', '邱', '骆', '高', '夏', '蔡', '田', '樊', '胡', '凌', '霍', '虞', '万', '支', '柯', '昝', '管', '卢', '莫', '经', '房', '裘', '缪', '干', '解', '应', '宗', '丁', '宣', '贲', '邓', '郁', '单', '杭', '洪', '包', '诸', '左', '石', '崔', '吉', '钮', '龚', '程', '嵇', '邢', '滑', '裴', '陆', '荣', '翁', '荀', '羊', '於', '惠', '甄', '麴', '家', '封', '芮', '羿', '储', '靳', '汲', '邴', '糜', '松', '井', '段', '富', '巫', '乌', '焦', '巴', '弓', '牧', '隗', '山', '谷', '车', '侯', '宓', '蓬', '全', '郗', '班', '仰', '秋', '仲', '伊', '宫', '宁', '仇', '栾', '暴', '甘', '钭', '厉', '戎', '祖', '武', '符', '刘', '景', '詹', '束', '龙', '叶', '幸', '司', '韶', '郜', '黎', '蓟', '薄', '印', '宿', '白', '怀', '蒲', '邰', '从', '鄂', '索', '咸', '籍', '赖', '卓', '蔺', '屠', '蒙', '池', '乔', '阴', '郁', '骨', '能', '苍', '双', '闻', '莘', '乌', '党', '翟', '谭', '贡', '劳', '逄', '姬', '申', '扶', '堵', '冉', '宰', '郦', '雍', '却', '璩', '桑', '桂', '濮', '牛', '寿', '通', '边', '扈', '燕', '冀', '郏', '浦', '尚', '农', '章', '闻', '冷', '乔', '晏', '柴', '阚', '党', '翟', '谭', '贡', '劳', '逄', '姬', '申', '扶', '堵', '冉', '宰', '郦', '雍', '却', '璩', '桑', '桂', '濮', '牛', '寿', '通', '边', '扈', '燕', '冀', '郏', '浦', '尚', '章'
])

// 过滤后的好字（供生成名字使用）- 加强版过滤
function getFilteredChars(wuxing) {
  const chars = ALL_DATA[wuxing] || {}
  const filtered = {}
  Object.entries(chars).forEach(([char, info]) => {
    // 跳过禁用字（加强版，包含更多生僻字和金属加工相关字）
    const extraForbidden = ['钗','钓','铸','镇','链','锤','钉','锁','针','锡','镐','镁','钠','铝','铜','铁','锣','镣','铛','闘','键','算','输','铲','铳','铴','铵','银','锄','锃','锂','锎','锏','锴','锶','铼','铍','铢','铣','锜','鍪','鏍','鏖','鏙','鏻','鏦','鏴','鏂','鏎','鏏','鏑','鏩','鏰','鏱','鏹','鐯','鐭','鐴','鑕','鑙','鑬','鑭','鑮','鑰','鑱']
    if (FORBIDDEN_CHARS.has(char) || extraForbidden.includes(char)) return
    // 跳过姓氏
    if (COMMON_SURNAMES.has(char)) return
    // 跳过寓意不好的字
    if (info.yuyi) {
      const badWords = ['凶', '难', '破', '败', '坏', '死', '亡', '衰', '枯', '腐', '臭', '脏', '秽', '淫', '赌', '毒', '癌', '坟', '鬼', '妖', '邪', '魔', '刑', '狱', '斩', '杀', '屠', '尸', '凶', '难', '破', '败', '坏']
      for (const bad of badWords) {
        if (info.yuyi.includes(bad)) return
      }
    }
    filtered[char] = info
  })
  return filtered
}

// 根据汉字获取五行属性
function getCharWuxing(char) {
  for (const wx of ['金', '木', '水', '火', '土']) {
    if (ALL_DATA[wx][char]) {
      return ALL_DATA[wx][char].wuxing || wx
    }
  }
  // 尝试通过偏旁推断五行
  const radicalWuxing = {
    '氵': '水', '冫': '水', '水': '水',
    '火': '火', '灬': '火',
    '木': '木', '艹': '木',
    '金': '金', '钅': '金', '匕': '金',
    '土': '土', '阝': '土', '王': '土'
  }
  return radicalWuxing[char] || '水'
}

// 根据汉字获取笔画数
function getCharStrokes(char) {
  for (const wx of ['金', '木', '水', '火', '土']) {
    if (ALL_DATA[wx][char]) {
      return ALL_DATA[wx][char].strokes || 10
    }
  }
  return 10
}

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

// 计算八字（使用 lunar-javascript 库）
function calculateBazi(solarDate, solarTime) {
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
  console.log('农历完整:', lunar.toString())

  // 获取八字
  const yearGanZhi = lunar.getYearInGanZhi()  // 年柱
  const monthGanZhi = lunar.getMonthInGanZhi()  // 月柱
  const dayGanZhi = lunar.getDayInGanZhi()  // 日柱
  const hourGanZhi = lunar.getTimeInGanZhi(hour)  // 时柱（需要传入小时）

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
  const lunarDateStr = lunar.toString()

  return {
    year: { gan: yearGan, zhi: yearZhi, wuxing: WUXING_MAP[yearGan] + WUXING_MAP[yearZhi] },
    month: { gan: monthGan, zhi: monthZhi, wuxing: WUXING_MAP[monthGan] + WUXING_MAP[monthZhi] },
    day: { gan: dayGan, zhi: dayZhi, wuxing: WUXING_MAP[dayGan] + WUXING_MAP[dayZhi] },
    hour: { gan: hourGan, zhi: hourZhi, wuxing: WUXING_MAP[hourGan] + WUXING_MAP[hourZhi] },
    wuxing: wuxingCount,
    dayMaster: dayMaster,
    xiyongshen: xiyongshen,
    lunarDate: lunarDateStr
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

// 模拟AI生成名字（实际应调用AI API）
function generateNamesByAI(input, bazi) {
  const { surname, gender, purpose, tags = [], preferredChars = [], avoidChars = [] } = input
  const { xiyongshen, wuxing } = bazi

  // 调试日志
  console.log('========== 开始生成名字 =========')
  console.log('生成名字参数:', { surname, gender, preferredChars, avoidChars })
  console.log('喜用神:', xiyongshen)

  // 从大字库获取指定五行的字列表（已过滤禁用字和姓氏）
  const getCharsByWuxing = (wx) => {
    const filtered = getFilteredChars(wx)
    return Object.keys(filtered)
  }

  // 根据喜用神选择五行对应的字（从大字库选取）
  const wuxingChars = {
    '金': getCharsByWuxing('金'),
    '木': getCharsByWuxing('木'),
    '水': getCharsByWuxing('水'),
    '火': getCharsByWuxing('火'),
    '土': getCharsByWuxing('土')
  }

  // 根据性别选择常用字（过滤禁用字和姓氏）
  // 诗词起名常用字 - 好听顺口有画意（精选适合名字第二位的字）
  const commonMaleChars = ['宇', '轩', '浩', '然', '睿', '哲', '翰', '彦', '承', '昊', '霖', '尧', '禹', '瑞', '泽', '博', '帆', '峻', '宣', '丞', '奕', '珩', '佑', '麒', '熙', '栩', '桐', '柏', '楷', '峥', '嵘', '宏', '嵩', '岚', '峰', '霆', '凯', '贤', '俊', '豪', '杰', '涛', '焱', '焕', '熠', '曜', '钧', '铭', '铎', '桓', '卿', '绍', '裕', '耀', '亮', '光', '远', '超', '逸', '舟', '凌', '霄', '瀚', '宸', '云', '风', '程', '展', '翅', '鹏', '志', '立', '正', '诚', '明', '理', '道', '德', '文', '章', '华', '国', '安', '宁', '天', '方', '圆', '晓', '畅', '珂', '琳', '瑄', '锦', '锋', '钟', '朗', '曜', '冠', '勋', '锡', '铠', '镇', '镜', '璇', '琪', '琳', '瑄', '锦', '杭', '杨', '梁', '栋', '梁', '材', '柏', '桐', '梓', '霖', '岳', '峰', '岩', '巍', '崇', '崎', '岁', '屹', '崖', '岳']
  const commonFemaleChars = ['雅', '婷', '萱', '怡', '欣', '蕾', '琪', '瑶', '婉', '玥', '晴', '岚', '沁', '苒', '珞', '颐', '沅', '莓', '葵', '瑾', '宁', '朵', '沂', '筱', '孜', '岱', '汐', '倪', '婕', '黛', '洛', '洱', '希', '晨', '若', '烟', '羽', '诗', '语', '凝', '霜', '凌', '薇', '蔓', '芸', '芷', '苑', '莹', '荧', '洁', '沐', '漾', '澔', '沛', '澜', '淳', '淑', '涵', '珂', '珊', '珈', '纾', '纨', '璐', '瑄', '琳', '璧', '璇', '禾', '筝', '笙', '箫', '梨', '棠', '桔', '槐', '橙', '樱', '桃', '梅', '兰', '菊', '莲', '荷', '竹', '蔚', '芯', '芳', '芬', '花', '苹', '秀', '娟', '媚', '妍', '娇', '笑', '盼', '倩', '影', '香', '暖', '柔', '静', '美', '丽', '嘉', '懿', '安然', '静好', '清欢', '知', '书', '画', '琴', '棋', '书', '墨', '秋', '春', '夏', '冬', '月', '星', '雨', '露', '霜', '雪', '风', '云', '烟', '翠', '玉', '珍', '珠', '琳', '瑶', '琪', '瑾', '璐']

  // 过滤 commonChars 中的禁用字和姓氏
  const filterCommonChars = (chars) => chars.filter(c => !FORBIDDEN_CHARS.has(c) && !COMMON_SURNAMES.has(c))
  const filteredMaleChars = filterCommonChars(commonMaleChars)
  const filteredFemaleChars = filterCommonChars(commonFemaleChars)

  // 从大字库获取常用好听的名字用字
  const getCommonChars = (gender) => {
    const chars = []
    // 从每个五行中选一些好听常用的字
    for (const wx of ['金', '木', '水', '火', '土']) {
      const charData = ALL_DATA[wx] || {}
      Object.entries(charData).forEach(([char, info]) => {
        // 选择寓意积极、读音好听的字
        if (info.yuyi && !info.yuyi.includes('凶') && !info.yuyi.includes('难') && !info.yuyi.includes('破') && !info.yuyi.includes('败')) {
          chars.push(char)
        }
      })
    }
    return chars.length > 0 ? chars : (gender === 1 ? filteredMaleChars : filteredFemaleChars)
  }

  const xiyongList = wuxingChars[xiyongshen] || wuxingChars['水']
  const commonList = getCommonChars(gender)
  const genderList = gender === 1 ? filteredMaleChars : filteredFemaleChars

  // 生成5个名字
  const names = []
  const usedChars = new Set()

  console.log('避讳字列表:', avoidChars)
  console.log('指定字列表:', preferredChars)

  for (let i = 0; i < 5; i++) {
    let wxChar, gnChar

    // 如果用户指定了字，优先使用
    if (preferredChars && preferredChars.length > 0) {
      console.log('>>> 使用指定字模式')
      // 随机选择一个指定字
      const availablePreferred = preferredChars.filter(c => !avoidChars.includes(c))
      console.log('过滤后的指定字:', availablePreferred)

      if (availablePreferred.length === 0) {
        console.log('所有指定字都被避讳，使用随机生成')
        // 所有指定字都被避讳，使用随机生成
        wxChar = xiyongList[Math.floor(Math.random() * xiyongList.length)]
        gnChar = genderList[Math.floor(Math.random() * genderList.length)]
      } else {
        const preferredIndex = Math.floor(Math.random() * availablePreferred.length)
        const preferredChar = availablePreferred[preferredIndex]
        console.log('选择的指定字:', preferredChar, '索引:', preferredIndex)

        // 50%概率指定字在第一位，50%在第二位
        if (Math.random() > 0.5) {
          wxChar = preferredChar
          gnChar = genderList[Math.floor(Math.random() * genderList.length)]
        } else {
          wxChar = xiyongList[Math.floor(Math.random() * xiyongList.length)]
          gnChar = preferredChar
        }
      }
    } else {
      console.log('>>> 使用随机生成模式')
      // 随机选择喜用神字和普通字
      wxChar = xiyongList[Math.floor(Math.random() * xiyongList.length)]
      gnChar = genderList[Math.floor(Math.random() * genderList.length)]
    }

    // 检查是否在避讳列表中
    if (avoidChars.includes(wxChar)) {
      console.log('第一个字在避讳列表，重新选择')
      continue
    }
    if (avoidChars.includes(gnChar)) {
      console.log('第二个字在避讳列表，重新选择')
      continue
    }

    // 确保不重复
    const name = wxChar + gnChar
    if (usedChars.has(name)) {
      console.log('名字重复，跳过:', name)
      continue
    }
    usedChars.add(name)
    console.log('生成名字:', name)

    // 计算分数 (85-98分)
    const score = 85 + Math.floor(Math.random() * 14)

    // 选择卦象
    const guaList = [
      { name: '乾卦', meaning: '天行健，君子以自强不息' },
      { name: '坤卦', meaning: '地势坤，君子以厚德载物' },
      { name: '兑卦', meaning: '刚中而柔外' },
      { name: '离卦', meaning: '明两作，大人以继明照于四方' },
      { name: '震卦', meaning: '洊雷，君子以恐惧修省' },
      { name: '巽卦', meaning: '随风，君子以申命行事' },
      { name: '坎卦', meaning: '水洊至，君子以常德行' },
      { name: '艮卦', meaning: '兼山，君子以思不出其位' }
    ]
    const gua = guaList[Math.floor(Math.random() * guaList.length)]

    // 生成寓意解读
    const interpretations = [
      '温润如玉，德才兼备',
      '志存高远，前程似锦',
      '博学多才，文采斐然',
      '清雅脱俗，气质非凡',
      '刚毅果敢，成就非凡'
    ]
    const interpretation = interpretations[Math.floor(Math.random() * interpretations.length)]

    // 生成诗意表达
    const poeticList = [
      `如${wxChar}之润，若${gnChar}之华`,
      `${wxChar}泽万物，${gnChar}耀星辰`,
      `${wxChar}沐春风，${gnChar}映朝阳`,
      `${wxChar}涵天地，${gnChar}贯古今`
    ]
    const poetic = poeticList[Math.floor(Math.random() * poeticList.length)]

    // 单字解析
    const singleChars = [
      {
        char: wxChar,
        pinyin: getPinyin(wxChar),
        wuxing: xiyongshen,
        strokes: getStrokes(wxChar),
        meaning: `天赋${xiyongshen}能量，寓意美好`
      },
      {
        char: gnChar,
        pinyin: getPinyin(gnChar),
        wuxing: getCharWuxing(gnChar),
        strokes: getStrokes(gnChar),
        meaning: gender === 1 ? '阳刚有力，气宇轩昂' : '温婉贤淑，气质优雅'
      }
    ]

    names.push({
      name: surname + wxChar + gnChar,
      score,
      wuxing: `${singleChars[0].wuxing}+${singleChars[1].wuxing}`,
      gua,
      interpretation,
      poetic,
      singleChars,
      wuge: calculateWuge(surname, wxChar + gnChar)
    })
  }

  return names.sort((a, b) => b.score - a.score)
}

// 获取拼音（使用 pinyin 库）
function getPinyin(char) {
  try {
    const result = pinyin.pinyin(char, {
      style: pinyin.STYLE_NORMAL,
      heteronym: false // 不显示多音字
    })
    // result 是一个二维数组，取第一个拼音的第一个音
    if (result && result[0] && result[0][0]) {
      return result[0][0]
    }
    return char
  } catch (e) {
    console.error('获取拼音失败:', char, e)
    return char
  }
}

// 获取字的笔画数
function getStrokes(char) {
  const strokesMap = {
    // 原有的字
    '沐': 8, '泽': 8, '涵': 11, '浩': 10, '洋': 9,
    '铭': 11, '锦': 13, '钧': 9, '锐': 12, '鑫': 24,
    '林': 8, '森': 12, '梓': 11, '楠': 13, '桐': 10,
    '炎': 8, '煜': 13, '烾': 21, '炜': 8, '灿': 7,
    '辰': 7, '坤': 8, '垚': 9, '培': 11, '基': 11,
    '宇': 6, '轩': 7, '然': 12, '睿': 14, '哲': 10,
    '翰': 16, '彦': 9, '承': 8, '昊': 8,
    '雅': 12, '婷': 12, '萱': 12, '怡': 8, '欣': 8,
    '蕾': 16, '琪': 12, '瑶': 14, '婉': 11, '玥': 9,
    '溪': 13, '沛': 7, '润': 10,
    '铮': 11, '铎': 10, '铄': 10,
    '栩': 10, '楷': 13, '棠': 12,
    '烨': 10, '熠': 15, '炅': 8,
    '垣': 9, '墨': 15, '城': 9,
    // 姓氏笔画
    '陈': 16, '李': 7, '张': 11, '刘': 15, '王': 4,
    '赵': 14, '黄': 11, '周': 8, '吴': 7, '徐': 10,
    '孙': 10, '胡': 9, '朱': 6, '高': 10, '何': 7,
    '郭': 15, '马': 10, '梁': 11, '宋': 7, '郑': 8,
    '谢': 17, '韩': 12, '唐': 10, '冯': 5, '于': 3,
    '董': 15, '萧': 18, '程': 12, '曹': 11, '袁': 10,
    '邓': 19, '许': 11, '傅': 12, '沈': 7, '曾': 12,
    '彭': 12, '吕': 7, '苏': 7, '卢': 16, '蒋': 13,
    '蔡': 17, '贾': 13, '丁': 2, '魏': 17, '薛': 16,
    // 补充更多常见字
    '仁': 4, '义': 13, '礼': 18, '智': 12, '信': 9,
    '忠': 8, '孝': 7, '德': 15, '文': 4, '武': 8,
    '明': 8, '国': 11, '华': 14, '永': 5, '建': 9,
    '志': 7, '世': 5, '道': 16, '良': 7, '友': 4,
    '邦': 11, '荣': 14, '安': 6, '平': 5, '东': 5,
    '强': 12, '斌': 12, '庆': 10, '龙': 16, '飞': 9,
    '春': 9, '宁': 5, '贵': 12, '金': 8, '生': 5,
    '福': 14, '祥': 11, '杰': 12, '豪': 14, '超': 12,
    '博': 12, '冠': 9, '鹏': 19, '宝': 8, '晖': 12
  }
  return strokesMap[char] || 10
}

// 计算五格（基于姓氏和名字）
function calculateWuge(surname, name) {
  // 姓氏笔画（简化，假设姓氏都是单字）
  const surnameStrokes = getSurnameStrokes(surname)

  // 名字两个字的笔画
  const char1Strokes = getStrokes(name[0])
  const char2Strokes = getStrokes(name[1])

  // 五格计算
  const tiange = surnameStrokes + 1 // 天格（姓氏+1）
  const renge = surnameStrokes + char1Strokes // 人格（姓氏+名首字）
  const dige = char1Strokes + char2Strokes // 地格（名首字+名次字）
  const waige = char2Strokes + 1 // 外格（名次字+1）
  const zongge = surnameStrokes + char1Strokes + char2Strokes // 总格（姓氏+名字）

  return {
    tiange: { num: tiange, wuxing: getWuxingByNum(tiange), jixiong: getJixiong(tiange, '天格') },
    renge: { num: renge, wuxing: getWuxingByNum(renge), jixiong: getJixiong(renge, '人格') },
    dige: { num: dige, wuxing: getWuxingByNum(dige), jixiong: getJixiong(dige, '地格') },
    waige: { num: waige, wuxing: getWuxingByNum(waige), jixiong: getJixiong(waige, '外格') },
    zongge: { num: zongge, wuxing: getWuxingByNum(zongge), jixiong: getJixiong(zongge, '总格') }
  }
}

// 获取姓氏笔画（简化版）
function getSurnameStrokes(surname) {
  const commonSurnames = {
    '王': 4, '李': 7, '张': 7, '刘': 6, '陈': 7, '杨': 7,
    '赵': 9, '黄': 11, '周': 8, '吴': 7, '徐': 10, '孙': 6,
    '胡': 9, '朱': 6, '高': 10, '林': 8, '何': 7, '郭': 10,
    '马': 3, '梁': 11, '宋': 7, '郑': 8, '谢': 12, '韩': 12
  }
  return commonSurnames[surname] || 6
}

// 根据数字获取五行（简化版）
function getWuxingByNum(num) {
  const wuxingMap = {
    1: '木', 2: '木', 3: '火', 4: '火', 5: '土',
    6: '土', 7: '金', 8: '金', 9: '水', 0: '水'
  }
  return wuxingMap[num % 10] || '水'
}

// 判断吉凶（简化版）
function getJixiong(num, type) {
  // 大吉数字
  const luckyNums = [1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 21, 23, 24, 25, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 63, 65, 67, 81]
  // 吉数字
  const goodNums = [35, 38]
  // 凶数字
  const badNums = [2, 4, 9, 10, 12, 14, 19, 20, 22, 26, 27, 28, 29, 30, 34, 36, 40, 42, 43, 44, 46, 49, 50, 53, 54, 56, 59, 60, 62, 64, 66, 68, 69, 70, 71, 72, 73, 74, 76, 79, 80]

  if (luckyNums.includes(num)) return '吉'
  if (goodNums.includes(num)) return '吉'
  if (badNums.includes(num)) return '凶'
  return '中'
}

// 获取今天的日期字符串
function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 如果没有openid，使用临时标识（匿名用户）
  const userId = openid || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { surname, gender, purpose, solarDate, solarTime, birthPlace, tags, avoidChars, preferredChars } = event

  if (!surname || !gender || !solarDate || !solarTime) {
    return {
      success: false,
      error: 'INVALID_PARAMS',
      message: '缺少必要参数'
    }
  }

  try {
    // 1. 先检查并消耗次数（直接操作数据库）
    console.log('========== generateNames 配额检查 ==========')
    console.log('OPENID:', openid, 'userId:', userId)

    const today = getTodayString()
    console.log('今日日期:', today)

    // 查询今日配额记录
    const quotaRes = await db.collection('daily_quota')
      .where({
        _openid: userId,
        date: today
      })
      .get()

    let quota
    if (quotaRes.data.length === 0) {
      // 创建新配额记录
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

    // 2. 计算八字
    const bazi = calculateBazi(solarDate, solarTime)

    // 3. 生成名字
    const input = { surname, gender, purpose, solarDate, solarTime, birthPlace, tags, avoidChars, preferredChars }
    const names = generateNamesByAI(input, bazi)

    // 4. 保存记录
    const recordData = {
      _openid: userId,
      input: {
        surname,
        gender,
        purpose: purpose || 'baby',
        solarDate,
        solarTime,
        birthPlace: birthPlace || '',
        tags: tags || [],
        avoidChars: avoidChars || [],
        preferredChars: preferredChars || []
      },
      bazi,
      results: names,
      costType: 'free',
      costQuotaId: quotaId,
      createTime: new Date()
    }

    const recordRes = await db.collection('generation_records').add({
      data: recordData
    })

    // 5. 更新用户累计数据（仅对真实登录用户）
    if (openid) {
      try {
        const userRes = await db.collection('users').where({ _openid: userId }).get()
        if (userRes.data.length > 0) {
          await db.collection('users').doc(userRes.data[0]._id).update({
            data: {
              totalGenerations: _.inc(1),
              lastUsedSurname: surname,
              updateTime: new Date()
            }
          })
        } else {
          // 创建用户记录
          await db.collection('users').add({
            data: {
              _openid: userId,
              nickName: '',
              avatarUrl: '',
              totalGenerations: 1,
              totalShares: 0,
              firstGenerationTime: new Date(),
              vipLevel: 0,
              vipExpireAt: null,
              lastUsedSurname: surname,
              createTime: new Date(),
              updateTime: new Date()
            }
          })
        }
      } catch (e) {
        console.log('更新用户数据失败:', e)
      }
    }

    return {
      success: true,
      names,
      bazi,
      recordId: recordRes._id
    }

  } catch (err) {
    console.error('生成名字失败:', err)
    return {
      success: false,
      error: 'GENERATION_ERROR',
      message: '生成名字失败，请稍后重试'
    }
  }
}
