// 步骤二：生辰信息
const quotaManager = require('../../../utils/quota.js')
const { showError } = require('../../../utils/util.js')

const SHICHEN_LIST = [
  { name: '深夜', range: '23:00-01:00', hour: 0, minute: 0 },
  { name: '凌晨', range: '01:00-03:00', hour: 2, minute: 0 },
  { name: '黎明', range: '03:00-05:00', hour: 4, minute: 0 },
  { name: '清晨', range: '05:00-07:00', hour: 6, minute: 0 },
  { name: '早晨', range: '07:00-09:00', hour: 8, minute: 0 },
  { name: '上午', range: '09:00-11:00', hour: 10, minute: 0 },
  { name: '中午', range: '11:00-13:00', hour: 12, minute: 0 },
  { name: '午后', range: '13:00-15:00', hour: 14, minute: 0 },
  { name: '下午', range: '15:00-17:00', hour: 16, minute: 0 },
  { name: '傍晚', range: '17:00-19:00', hour: 18, minute: 0 },
  { name: '晚上', range: '19:00-21:00', hour: 20, minute: 0 },
  { name: '夜间', range: '21:00-23:00', hour: 22, minute: 0 }
]

Page({
  data: {
    form: {
      solarDate: '',
      solarTime: '',
      birthPlace: '',
      tags: [],
      avoidChars: [],
      preferredChars: []
    },
    today: '',
    region: [],
    shiChenName: '',
    shiChenList: SHICHEN_LIST,
    wishTags: [
      { value: 'health', label: '健康', icon: '💪', selected: false },
      { value: 'study', label: '聪慧', icon: '📚', selected: false },
      { value: 'virtue', label: '品德', icon: '🌟', selected: false },
      { value: 'career', label: '才华', icon: '💼', selected: false },
      { value: 'happiness', label: '快乐', icon: '😊', selected: false },
      { value: 'beauty', label: '美好', icon: '🌸', selected: false }
    ],
    avoidInput: '',
    preferredInput: '',
    quotaText: '剩余1次',
    showShichenModal: false,
    isFormValid: false,
    focusAvoid: false,
    focusPreferred: false
  },

  onLoad() {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    this.setData({ today: todayStr })
    this.loadQuota()
  },

  async loadQuota() {
    try {
      const quota = await quotaManager.getQuota()
      this.setData({ quotaText: `剩余${quota.remaining}次` })
    } catch (err) {
      console.error('加载配额失败:', err)
    }
  },

  onDateChange(e) {
    this.setData({ 'form.solarDate': e.detail.value })
    this.checkFormValid()
  },

  onTimeChange(e) {
    const time = e.detail.value
    const [hour, minute] = time.split(':').map(Number)
    const shiChen = this.getShichenName(hour, minute)
    this.setData({
      'form.solarTime': time,
      shiChenName: shiChen
    })
    this.checkFormValid()
  },

  getShichenName(hour, minute) {
    const totalMinutes = hour * 60 + minute

    // 特殊处理深夜时段（23:00-01:00，跨午夜）
    if (hour === 23 || hour === 0) {
      return '深夜'
    }

    // 其他时段：根据小时数计算
    const shichenIndex = Math.floor((hour - 1) / 2)
    const shichenNames = ['凌晨', '黎明', '清晨', '早晨', '上午', '中午', '午后', '下午', '傍晚', '晚上', '夜间']

    if (shichenIndex >= 0 && shichenIndex < shichenNames.length) {
      return shichenNames[shichenIndex]
    }

    return '深夜'
  },

  onRegionChange(e) {
    const region = e.detail.value
    this.setData({
      region: region,
      'form.birthPlace': region.join(' ')
    })
  },

  toggleTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = this.data.wishTags

    const selectedCount = tags.filter(t => t.selected).length

    if (!tags[index].selected && selectedCount >= 3) {
      showError('最多选择3个期望特点')
      return
    }

    tags[index].selected = !tags[index].selected
    this.setData({
      wishTags: tags,
      'form.tags': tags.filter(t => t.selected).map(t => t.value)
    })
  },

  onAvoidInput(e) {
    this.setData({ avoidInput: e.detail.value })
  },

  onAvoidFocus() {
    this.setData({ focusAvoid: true })
  },

  onAvoidBlur() {
    this.setData({ focusAvoid: false })
  },

  onPreferredInput(e) {
    this.setData({ preferredInput: e.detail.value })
  },

  onPreferredFocus() {
    this.setData({ focusPreferred: true })
  },

  onPreferredBlur() {
    this.setData({ focusPreferred: false })
  },

  addPreferredChar(e) {
    const value = e.detail.value.trim()
    if (!value) return

    const chars = value.split(/[\s,，]+/).filter(c => c.length > 0)
    const currentChars = this.data.form.preferredChars || []

    const step1Data = wx.getStorageSync('form_step1')
    for (let char of chars) {
      char = char.charAt(0)
      if (step1Data && step1Data.surname === char) {
        showError('固定用字不能与姓氏相同')
        continue
      }
      if (this.data.form.avoidChars && this.data.form.avoidChars.includes(char)) {
        showError('固定用字不能是排除的字')
        continue
      }
      if (!currentChars.includes(char)) {
        currentChars.push(char)
      }
    }

    this.setData({
      'form.preferredChars': currentChars,
      preferredInput: ''
    })
  },

  addPreferredCharFromBtn() {
    const value = this.data.preferredInput.trim()
    if (!value) {
      showError('请输入固定用字')
      return
    }

    const chars = value.split(/[\s,，]+/).filter(c => c.length > 0)
    const currentChars = this.data.form.preferredChars || []

    const step1Data = wx.getStorageSync('form_step1')
    for (let char of chars) {
      char = char.charAt(0)
      if (step1Data && step1Data.surname === char) {
        showError('固定用字不能与姓氏相同')
        continue
      }
      if (this.data.form.avoidChars && this.data.form.avoidChars.includes(char)) {
        showError('固定用字不能是排除的字')
        continue
      }
      if (!currentChars.includes(char)) {
        currentChars.push(char)
      }
    }

    this.setData({
      'form.preferredChars': currentChars,
      preferredInput: ''
    })

    console.log('添加固定用字后:', currentChars)
  },

  removePreferredChar(e) {
    const char = e.currentTarget.dataset.char
    const chars = this.data.form.preferredChars.filter(c => c !== char)
    this.setData({ 'form.preferredChars': chars })
  },

  addAvoidChar(e) {
    const value = e.detail.value.trim()
    if (!value) return

    const chars = value.split(/[\s,，]+/).filter(c => c.length > 0)
    const currentChars = this.data.form.avoidChars || []

    const step1Data = wx.getStorageSync('form_step1')
    for (let char of chars) {
      char = char.charAt(0)
      if (step1Data && step1Data.surname === char) {
        showError('排除的字不能与姓氏相同')
        continue
      }
      if (!currentChars.includes(char)) {
        currentChars.push(char)
      }
    }

    this.setData({
      'form.avoidChars': currentChars,
      avoidInput: ''
    })
  },

  addAvoidCharFromBtn() {
    const value = this.data.avoidInput.trim()
    if (!value) {
      showError('请输入不想用的字')
      return
    }

    const chars = value.split(/[\s,，]+/).filter(c => c.length > 0)
    const currentChars = this.data.form.avoidChars || []

    const step1Data = wx.getStorageSync('form_step1')
    for (let char of chars) {
      char = char.charAt(0)
      if (step1Data && step1Data.surname === char) {
        showError('排除的字不能与姓氏相同')
        continue
      }
      if (!currentChars.includes(char)) {
        currentChars.push(char)
      }
    }

    this.setData({
      'form.avoidChars': currentChars,
      avoidInput: ''
    })

    console.log('添加排除字后:', currentChars)
  },

  removeAvoidChar(e) {
    const char = e.currentTarget.dataset.char
    const chars = this.data.form.avoidChars.filter(c => c !== char)
    this.setData({ 'form.avoidChars': chars })
  },

  showShichenPicker() {
    this.setData({ showShichenModal: true })
  },

  closeShichenModal() {
    this.setData({ showShichenModal: false })
  },

  selectShichen(e) {
    const index = e.currentTarget.dataset.index
    const sc = SHICHEN_LIST[index]
    const timeStr = `${String(sc.hour).padStart(2, '0')}:${String(sc.minute).padStart(2, '0')}`

    this.setData({
      'form.solarTime': timeStr,
      shiChenName: sc.name,
      showShichenModal: false
    })
    this.checkFormValid()
  },

  selectUnsureShichen() {
    this.setData({
      'form.solarTime': '12:00',
      shiChenName: '中午（默认）',
      showShichenModal: false
    })
    wx.showModal({
      title: '温馨提示',
      content: '已默认选择中午。建议询问父母后重新分析，以获得更精准的结果。',
      showCancel: false
    })
    this.checkFormValid()
  },

  checkFormValid() {
    const { solarDate, solarTime } = this.data.form
    const isValid = solarDate && solarTime
    this.setData({ isFormValid: isValid })
    return isValid
  },

  viewBazi() {
    if (!this.data.isFormValid) {
      const { solarDate, solarTime } = this.data.form
      if (!solarDate) {
        showError('请选择出生日期')
      } else if (!solarTime) {
        showError('请选择出生时间')
        }
      return
    }

    // 添加调试日志
    console.log('========== 提交的数据 ==========')
    console.log('step2.data.form:', this.data.form)
    console.log('固定用字:', this.data.form.preferredChars)
    console.log('排除字:', this.data.form.avoidChars)

    const step1Data = wx.getStorageSync('form_step1') || {}
    const formData = { ...step1Data, ...this.data.form }
    wx.setStorageSync('form_data', formData)

    wx.navigateTo({ url: '/pages/bazi/analysis/analysis' })
  },

  goBack() {
    wx.navigateBack()
  }
})
