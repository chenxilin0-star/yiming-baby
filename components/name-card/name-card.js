// 名字卡片组件
Component({
  properties: {
    nameData: {
      type: Object,
      value: {}
    },
    rank: {
      type: Number,
      value: 1
    },
    expanded: {
      type: Boolean,
      value: false
    },
    showQuote: {
      type: Boolean,
      value: true
    }
  },

  data: {
    scoreColor: '#d4af37'
  },

  observers: {
    'nameData.score': function(score) {
      let color = '#8a8a8a'
      if (score >= 90) color = '#d4af37'
      else if (score >= 80) color = '#52c41a'
      else if (score >= 70) color = '#4a90d9'
      this.setData({ scoreColor: color })
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap')
    }
  }
})
