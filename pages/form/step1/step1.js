// 步骤一：基础信息
const { showError } = require('../../../utils/util.js')

const HOT_SURNAMES = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙']

const FU_XING = ['欧阳', '太史', '端木', '上官', '司马', '东方', '独孤', '南宫', '夏侯', '诸葛']

Page({
  data: {
    form: {
      surname: '',
      gender: null,
      purpose: ''
    },
    inputSurname: '',  // 输入框显示的值，输入时不限制
    purposeOptions: [
      { value: 'baby', label: '宝宝起名', icon: '👶', desc: '为新生儿取一个吉祥好名' },
      { value: 'adult', label: '成人改名', icon: '✨', desc: '焕新人生，开启新篇' },
      { value: 'pen', label: '笔名艺名', icon: '🎭', desc: '文艺气息，独特个性' },
      { value: 'company', label: '公司品牌', icon: '🏢', desc: '商业命名，品牌价值' }
    ],
    hotSurnames: HOT_SURNAMES,
    showQuickSurnames: true,
    focusSurname: false,
    isFormValid: false
  },

  onLoad() {
    this.loadLastSurname()
  },

  // 加载上次使用的姓氏
  async loadLastSurname() {
    try {
      const lastSurname = wx.getStorageSync('last_surname')
      if (lastSurname) {
        this.setData({
          'form.surname': lastSurname,
          inputSurname: lastSurname
        })
        this.checkFormValid()
      }
    } catch (e) {
      console.log('加载姓氏失败')
    }
  },

  // 姓氏输入 - 输入时不限制，保持流畅
  onSurnameInput(e) {
    const value = e.detail.value
    
    // 实时更新输入框显示，不做限制
    this.setData({
      inputSurname: value,
      showQuickSurnames: value.length === 0
    })
    
    // 如果已经是1-2个中文字符，直接更新form
    const chineseValue = value.replace(/[^\u4e00-\u9fa5]/g, '')
    if (chineseValue.length > 0 && chineseValue.length <= 2) {
      this.setData({
        'form.surname': chineseValue
      })
      this.checkFormValid()
    }
  },

  // 姓氏聚焦
  onSurnameFocus() {
    this.setData({
      focusSurname: true,
      showQuickSurnames: !this.data.form.surname
    })
  },

  // 姓氏失焦 - 此时进行过滤和限制
  onSurnameBlur() {
    const value = this.data.inputSurname.trim()
    
    // 只保留中文字符，最多2个字
    let chineseValue = value.replace(/[^\u4e00-\u9fa5]/g, '').slice(0, 2)
    
    this.setData({
      'form.surname': chineseValue,
      inputSurname: chineseValue,  // 同步输入框显示
      focusSurname: false,
      showQuickSurnames: false
    })
    
    this.checkFormValid()
  },

  // 清除姓氏
  clearSurname() {
    this.setData({
      'form.surname': '',
      inputSurname: '',
      showQuickSurnames: true
    })
    this.checkFormValid()
  },

  // 选择姓氏
  selectSurname(e) {
    const surname = e.currentTarget.dataset.surname
    this.setData({
      'form.surname': surname,
      inputSurname: surname,
      showQuickSurnames: false
    })
    this.checkFormValid()
  },

  // 选择性别
  selectGender(e) {
    const gender = parseInt(e.currentTarget.dataset.gender)
    this.setData({
      'form.gender': gender
    })
    this.checkFormValid()
  },

  // 选择用途
  selectPurpose(e) {
    const value = e.currentTarget.dataset.value
    this.setData({
      'form.purpose': value
    })
    this.checkFormValid()
  },

  // 检查表单有效性
  checkFormValid() {
    const { surname, gender, purpose } = this.data.form
    const isValid = surname && gender && purpose
    this.setData({ isFormValid: isValid })
    return isValid
  },

  // 下一步
  nextStep() {
    if (!this.data.isFormValid) {
      const { surname, gender, purpose } = this.data.form
      if (!surname) {
        showError('请输入姓氏')
      } else if (!gender) {
        showError('请选择性别')
      } else if (!purpose) {
        showError('请选择用途')
      }
      wx.vibrateShort({ type: 'light' })
      return
    }

    // 保存姓氏到本地
    wx.setStorageSync('last_surname', this.data.form.surname)

    // 检查是否为复姓
    const isFuXing = FU_XING.includes(this.data.form.surname)

    // 保存表单数据
    wx.setStorageSync('form_step1', {
      ...this.data.form,
      isFuXing
    })

    // 跳转到步骤二
    wx.navigateTo({
      url: '/pages/form/step2/step2'
    })
  },

  // 返回
  goBack() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
