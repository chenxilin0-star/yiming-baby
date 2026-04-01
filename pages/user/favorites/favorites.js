// 我的收藏页
const { showSuccess, showError, showModal } = require('../../../utils/util.js')

// 评分颜色
function getScoreColor(score) {
  if (score >= 90) return '#d4af37'
  if (score >= 80) return '#52c41a'
  if (score >= 70) return '#4a90d9'
  return '#8a8a8a'
}

Page({
  data: {
    favorites: [],
    isEditing: false,
    allSelected: false,
    selectedCount: 0,
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadFavorites()
  },

  onShow() {
    if (!this.data.isEditing) {
      this.loadFavorites()
    }
  },

  // 加载收藏列表
  async loadFavorites(refresh = true) {
    if (this.data.loading) return
    
    this.setData({ loading: true })

    try {
      const page = refresh ? 1 : this.data.page
      
      const { result } = await wx.cloud.callFunction({
        name: 'getFavorites',
        data: {
          page,
          pageSize: this.data.pageSize
        }
      })

      if (result.success) {
        const favorites = result.list.map(item => ({
          ...item,
          scoreColor: getScoreColor(item.score),
          selected: false
        }))

        this.setData({
          favorites: refresh ? favorites : [...this.data.favorites, ...favorites],
          page: page + 1,
          hasMore: result.hasMore,
          loading: false
        })
      }
    } catch (err) {
      console.error('加载收藏失败:', err)
      this.setData({ loading: false })
      showError('加载失败')
    }
  },

  // 加载更多
  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadFavorites(false)
    }
  },

  // 切换编辑模式
  toggleEdit() {
    const isEditing = !this.data.isEditing
    
    if (!isEditing) {
      // 退出编辑模式时清除选择
      const favorites = this.data.favorites.map(item => ({
        ...item,
        selected: false
      }))
      this.setData({
        favorites,
        allSelected: false,
        selectedCount: 0
      })
    }

    this.setData({ isEditing })
  },

  // 选择项目
  selectItem(e) {
    if (!this.data.isEditing) {
      // 非编辑模式下跳转到详情
      // TODO: 跳转到详情
      return
    }

    const index = e.currentTarget.dataset.index
    const favorites = this.data.favorites
    favorites[index].selected = !favorites[index].selected

    const selectedCount = favorites.filter(item => item.selected).length
    const allSelected = selectedCount === favorites.length && favorites.length > 0

    this.setData({
      favorites,
      selectedCount,
      allSelected
    })
  },

  // 全选
  selectAll() {
    const allSelected = !this.data.allSelected
    const favorites = this.data.favorites.map(item => ({
      ...item,
      selected: allSelected
    }))

    this.setData({
      favorites,
      allSelected,
      selectedCount: allSelected ? favorites.length : 0
    })
  },

  // 删除选中
  async deleteSelected() {
    if (this.data.selectedCount === 0) {
      showError('请先选择要删除的项目')
      return
    }

    const confirm = await showModal('确认删除', `确定删除选中的 ${this.data.selectedCount} 个收藏？`)
    if (!confirm) return

    const selectedItems = this.data.favorites.filter(item => item.selected)
    
    try {
      for (const item of selectedItems) {
        await wx.cloud.callFunction({
          name: 'toggleFavorite',
          data: {
            recordId: item.recordId,
            name: item.name,
            action: 'remove'
          }
        })
      }

      showSuccess('删除成功')
      this.loadFavorites()
      this.toggleEdit()
    } catch (err) {
      console.error('删除失败:', err)
      showError('删除失败')
    }
  },

  // 对比选中
  compareSelected() {
    if (this.data.selectedCount < 2) {
      showError('请至少选择2个名字进行对比')
      return
    }
    
    // TODO: 跳转到对比页
    wx.showToast({
      title: '对比功能开发中',
      icon: 'none'
    })
  },

  // 去起名
  goToNaming() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})
