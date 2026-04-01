// 分享海报页
const { showSuccess, showError, saveImageToAlbum } = require('../../../utils/util.js')

Page({
  data: {
    canvasWidth: 300,
    canvasHeight: 534,
    templates: [
      { name: '简约版', type: 'simple' },
      { name: '详细版', type: 'detail' },
      { name: '可爱版', type: 'cute' }
    ],
    currentTemplate: 0,
    customText: '',
    nameData: {},
    baziData: {},
    isImageLoaded: false  // 图片是否加载完成
  },

  onLoad() {
    // 加载名字数据
    const result = wx.getStorageSync('generation_result')
    if (result) {
      this.setData({
        nameData: result.names[0],
        baziData: result.bazi
      })
    }

    // 获取系统信息计算canvas尺寸
    const sysInfo = wx.getSystemInfoSync()
    const canvasWidth = Math.min(375, sysInfo.windowWidth - 64)
    const canvasHeight = canvasWidth * 1.78 // 16:9比例

    this.setData({
      canvasWidth,
      canvasHeight
    })

    // 绘制海报
    this.drawPoster()
  },

  // 选择模板
  selectTemplate(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentTemplate: index })
    this.drawPoster()
  },

  // 自定义文案输入
  onCustomTextInput(e) {
    this.setData({
      customText: e.detail.value
    })
    this.drawPoster()
  },

  // 绘制海报
  drawPoster() {
    // 设置图片未加载状态
    this.setData({ isImageLoaded: false })

    const query = wx.createSelectorQuery()
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        // 设置canvas尺寸
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = this.data.canvasWidth * dpr
        canvas.height = this.data.canvasHeight * dpr
        ctx.scale(dpr, dpr)

        // 绘制背景
        ctx.fillStyle = '#fafafa'
        ctx.fillRect(0, 0, this.data.canvasWidth, this.data.canvasHeight)

        // 绘制装饰
        ctx.strokeStyle = '#e8e8e8'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(20, 80)
        ctx.lineTo(this.data.canvasWidth - 20, 80)
        ctx.stroke()

        // 绘制标题
        ctx.fillStyle = '#1a1a1a'
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('国学智能起名', this.data.canvasWidth / 2, 60)

        // 绘制分隔线
        ctx.strokeStyle = '#c45c48'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(this.data.canvasWidth / 2 - 60, 75)
        ctx.lineTo(this.data.canvasWidth / 2 + 60, 75)
        ctx.stroke()

        // 绘制名字
        ctx.fillStyle = '#1a1a1a'
        ctx.font = 'bold 48px sans-serif'
        ctx.fillText(this.data.nameData.name || '李沐辰', this.data.canvasWidth / 2, 180)

        // 绘制分隔装饰
        ctx.strokeStyle = '#c45c48'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(this.data.canvasWidth / 2 - 50, 210)
        ctx.lineTo(this.data.canvasWidth / 2 + 50, 210)
        ctx.stroke()

        // 绘制五行
        ctx.fillStyle = '#4a4a4a'
        ctx.font = '16px sans-serif'
        ctx.fillText(`五行：${this.data.nameData.wuxing || '水+土'}`, this.data.canvasWidth / 2, 250)

        // 绘制寓意
        ctx.fillStyle = '#8a8a8a'
        ctx.font = '14px sans-serif'
        const interpretation = this.data.nameData.interpretation || '如沐春风，温润而泽'
        ctx.fillText(`"${interpretation}"`, this.data.canvasWidth / 2, 290)

        // 绘制二维码图片
        const qrCodeImg = canvas.createImage()
        qrCodeImg.src = '/images/baobao.png'
        qrCodeImg.onload = () => {
          // 绘制二维码图片
          ctx.drawImage(qrCodeImg, this.data.canvasWidth / 2 - 50, 330, 100, 100)
          // 标记图片加载完成
          this.setData({ isImageLoaded: true })
        }
        qrCodeImg.onerror = () => {
          // 图片加载失败时显示占位图
          console.error('二维码图片加载失败')
          ctx.fillStyle = '#f5f5f5'
          ctx.fillRect(this.data.canvasWidth / 2 - 50, 330, 100, 100)
          ctx.fillStyle = '#8a8a8a'
          ctx.font = '12px sans-serif'
          ctx.fillText('二维码', this.data.canvasWidth / 2, 385)
          // 标记图片加载完成（虽然是失败状态）
          this.setData({ isImageLoaded: true })
        }

        // 绘制扫码提示
        ctx.fillStyle = '#8a8a8a'
        ctx.font = '14px sans-serif'
        ctx.fillText('长按扫码，为宝宝取好名', this.data.canvasWidth / 2, 460)

        // 绘制五行信息
        ctx.fillStyle = '#c45c48'
        ctx.font = '12px sans-serif'
        ctx.fillText(`宜用五行：${this.data.baziData.xiyongshen || '水、金'}`, this.data.canvasWidth / 2, 500)

        // 保存canvas引用
        this.canvas = canvas
      })
  },

  // 保存海报
  savePoster() {
    if (!this.canvas) return

    // 检查图片是否加载完成
    if (!this.data.isImageLoaded) {
      showError('海报生成中，请稍候...')
      return
    }

    wx.canvasToTempFilePath({
      canvas: this.canvas,
      success: (res) => {
        saveImageToAlbum(res.tempFilePath)
          .then(() => {
            showSuccess('保存成功')
          })
          .catch(() => {
            showError('保存失败')
          })
      },
      fail: () => {
        showError('生成图片失败')
      }
    })
  },

  // 分享海报
  sharePoster() {
    if (!this.canvas) return

    // 检查图片是否加载完成
    if (!this.data.isImageLoaded) {
      showError('海报生成中，请稍候...')
      return
    }

    wx.canvasToTempFilePath({
      canvas: this.canvas,
      success: (res) => {
        wx.showShareImageMenu({
          path: res.tempFilePath,
          fail: () => {
            showError('分享失败')
          }
        })
      },
      fail: () => {
        showError('生成图片失败')
      }
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})
