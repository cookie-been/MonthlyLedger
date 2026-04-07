var app = getApp()
var util = require('../../utils/util.js')

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

  exportData: function() {
    var that = this
    var data = JSON.stringify({
      channels: app.globalData.channels,
      records: app.globalData.records,
      settings: app.globalData.settings,
      achievements: app.globalData.achievements,
      exportTime: util.formatTime(new Date())
    }, null, 2)

    var timestamp = new Date().getTime()
    var fileName = 'MonthlyLedger_backup_' + timestamp + '.txt'
    
    var fs = wx.getFileSystemManager()
    var filePath = wx.env.USER_DATA_PATH + '/' + fileName
    
    fs.writeFile({
      filePath: filePath,
      data: data,
      encoding: 'utf8',
      success: function() {
        wx.showActionSheet({
          itemList: ['分享到微信', '查看文件路径'],
          success: function(res) {
            if (res.tapIndex === 0) {
              // 分享文件
              wx.shareAppMessage({
                title: '负债管理数据备份',
                path: filePath
              })
            } else {
              wx.showModal({
                title: '文件路径',
                content: filePath,
                showCancel: false
              })
            }
          }
        })
      },
      fail: function(err) {
        wx.showToast({ title: '导出失败', icon: 'none' })
        console.error(err)
      }
    })
  },

  importData: function() {
    var that = this
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: function(res) {
        var filePath = res.tempFiles[0].path
        var fs = wx.getFileSystemManager()
        fs.readFile({
          filePath: filePath,
          encoding: 'utf8',
          success: function(readRes) {
            try {
              var data = JSON.parse(readRes.data)
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
                that.setData({ settings: app.globalData.settings })
              } else {
                wx.showToast({ title: '数据格式错误', icon: 'none' })
              }
            } catch(e) {
              wx.showToast({ title: '数据格式错误', icon: 'none' })
            }
          },
          fail: function(err) {
            wx.showToast({ title: '读取文件失败', icon: 'none' })
            console.error(err)
          }
        })
      }
    })
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
  },

  goCalendar: function() {
    wx.switchTab({ url: '/pages/calendar/calendar' })
  }
})
