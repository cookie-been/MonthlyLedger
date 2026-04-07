var app = getApp()
var util = require('../../utils/util.js')

Page({
  data: {
    totalDebt: 0,
    clearedCount: 0,
    totalRepaid: 0,
    useDays: 0
  },

  onShow: function() {
    var channels = app.globalData.channels || []
    var totalDebt = 0
    var totalOrig = 0
    var clearedCount = 0
    var i

    for (i = 0; i < channels.length; i++) {
      totalDebt += channels[i].remaining
      totalOrig += channels[i].totalAmount
      if (channels[i].remaining === 0) {
        clearedCount++
      }
    }

    var totalRepaid = totalOrig - totalDebt
    var createdAt = app.globalData.createdAt || util.formatTime(new Date())
    var createdDate = util.parseDate(createdAt)
    var now = new Date()
    var useDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    this.setData({ totalDebt: totalDebt, totalRepaid: totalRepaid, clearedCount: clearedCount, useDays: useDays })
  },

  formatMoney: function(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  goAnalytics: function() {
    wx.navigateTo({ url: '/pages/analytics/analytics' })
  },

  goSuggestion: function() {
    wx.navigateTo({ url: '/pages/suggestion/suggestion' })
  },

  goAchievement: function() {
    wx.navigateTo({ url: '/pages/achievement/achievement' })
  },

  goSettings: function() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  showAbout: function() {
    wx.showModal({
      title: '关于我们',
      content: '负债管理 v2.0.0\n致力于帮助用户轻松管理债务，早日实现财务自由。',
      showCancel: false
    })
  },

  exportData: function() {
    var data = JSON.stringify({
      channels: app.globalData.channels,
      records: app.globalData.records,
      settings: app.globalData.settings,
      achievements: app.globalData.achievements,
      exportTime: util.formatTime(new Date())
    }, null, 2)

    wx.setClipboardData({
      data: data,
      success: function() {
        wx.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
      }
    })
  },

  importData: function() {
    var that = this
    wx.showModal({
      title: '导入数据',
      content: '请粘贴JSON数据到剪贴板后点击确定',
      success: function(res) {
        if (res.confirm) {
          wx.getClipboardData({
            success: function(clip) {
              try {
                var data = JSON.parse(clip.data)
                if (data.channels) {
                  app.globalData.channels = data.channels
                  app.globalData.records = data.records || []
                  if (data.settings) {
                    var s = app.globalData.settings
                    var key
                    for (key in data.settings) {
                      if (data.settings.hasOwnProperty(key)) {
                        s[key] = data.settings[key]
                      }
                    }
                  }
                  if (data.achievements) app.globalData.achievements = data.achievements
                  app.saveData()
                  wx.showToast({ title: '导入成功', icon: 'success' })
                }
              } catch(e) {
                wx.showToast({ title: '数据格式错误', icon: 'none' })
              }
            }
          })
        }
      }
    })
  }
})
