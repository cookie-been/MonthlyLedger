var app = getApp()

Page({
  data: {},

  onLoad: function() {
    var that = this
    setTimeout(function() {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }, 1000)
  }
})