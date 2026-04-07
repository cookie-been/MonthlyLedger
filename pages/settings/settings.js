var app = getApp()

Page({
  data: {
    settings: {}
  },

  onShow: function() {
    this.setData({ settings: app.globalData.settings })
  },

  toggleReminder: function(e) {
    app.globalData.settings.reminderEnabled = e.detail.value
    app.saveData()
    this.setData({ 'settings.reminderEnabled': e.detail.value })
    wx.showToast({ title: '设置已更新', icon: 'success' })
  },

  toggleHideAmount: function(e) {
    app.globalData.settings.hideAmount = e.detail.value
    app.saveData()
    this.setData({ 'settings.hideAmount': e.detail.value })
    wx.showToast({ title: '设置已更新', icon: 'success' })
  },

  clearData: function() {
    var that = this
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有数据吗？此操作不可恢复。',
      success: function(res) {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.reLaunch({ url: '/pages/index/index' })
        }
      }
    })
  }
})
