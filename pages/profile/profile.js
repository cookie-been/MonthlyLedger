var app = getApp()
var util = require('../../utils/util.js')

Page({
  data: {
    totalDebt: 0,
    totalDebtDisplay: '0.00',
    clearedCount: 0,
    totalRepaid: 0,
    totalRepaidDisplay: '0.00',
    useDays: 0,
    userInfo: {}
  },

  onShow: function() {
    var that = this
    this.setData({ userInfo: app.globalData.userInfo })
    
    var channels = app.globalData.channels || []
    var totalDebt = 0
    var totalOrig = 0
    var clearedCount = 0

    for (var i = 0; i < channels.length; i++) {
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

    this.setData({ 
      totalDebt: totalDebt, 
      totalDebtDisplay: this.formatMoney(totalDebt),
      totalRepaid: totalRepaid,
      totalRepaidDisplay: this.formatMoney(totalRepaid), 
      clearedCount: clearedCount, 
      useDays: useDays 
    })
  },

  chooseAvatar: function() {
    var that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        var tempFilePath = res.tempFiles[0].tempFilePath
        var fs = wx.getFileSystemManager()
        var newPath = wx.env.USER_DATA_PATH + '/avatar_' + Date.now() + '.png'
        
        fs.saveFile({
          tempFilePath: tempFilePath,
          filePath: newPath,
          success: function(saveRes) {
            app.globalData.userInfo.avatarUrl = saveRes.savedFilePath
            app.saveData()
            that.setData({ userInfo: app.globalData.userInfo })
            wx.showToast({ title: '头像已更新', icon: 'success' })
          }
        })
      }
    })
  },

  editNickName: function() {
    var that = this
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称（2-10个字符）',
      success: function(res) {
        if (res.confirm && res.content) {
          var name = res.content.trim()
          // 长度限制：2-10个字符
          if (name.length < 2 || name.length > 10) {
            wx.showToast({ title: '昵称需2-10个字符', icon: 'none' })
            return
          }
          // 只允许中文、字母、数字
          if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(name)) {
            wx.showToast({ title: '仅限中文、字母、数字', icon: 'none' })
            return
          }
          app.globalData.userInfo.nickName = name
          app.saveData()
          that.setData({ userInfo: app.globalData.userInfo })
          wx.showToast({ title: '昵称已更新', icon: 'success' })
        }
      }
    })
  },

  formatMoney: function(val) {
    if (val === undefined || val === null) return '0.00'
    var num = Number(val)
    if (isNaN(num)) return '0.00'
    var arr = num.toFixed(2).split('.')
    var intPart = arr[0]
    var decimal = arr[1] || '00'
    var result = ''
    while (intPart.length > 3) {
      result = ',' + intPart.slice(-3) + result
      intPart = intPart.slice(0, -3)
    }
    return intPart + result + '.' + decimal
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
  }
})
