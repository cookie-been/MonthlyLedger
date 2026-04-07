var util = require('./utils/util.js')

App({
  globalData: {
    channels: [],
    records: [],
    settings: {
      reminderEnabled: true,
      reminderTime: '09:00',
      reminderAdvance: 1,
      hideAmount: false
    },
    achievements: [],
    createdAt: '',
    userInfo: {
      nickName: '用户',
      avatarUrl: ''
    }
  },

  onLaunch: function() {
    var that = this
    try {
      var saved = wx.getStorageSync('debt_data')
      if (saved && saved.channels) {
        that.globalData.channels = saved.channels
        that.globalData.records = saved.records || []
        that.globalData.settings = saved.settings || that.globalData.settings
        that.globalData.achievements = saved.achievements || []
        that.globalData.createdAt = saved.createdAt || ''
        that.globalData.userInfo = saved.userInfo || { nickName: '用户', avatarUrl: '' }
      }
    } catch (e) {
      console.error('Init error:', e)
    }
  },

  saveData: function() {
    try {
      var dataToSave = {
        channels: this.globalData.channels,
        records: this.globalData.records,
        settings: this.globalData.settings,
        achievements: this.globalData.achievements,
        createdAt: this.globalData.createdAt,
        userInfo: this.globalData.userInfo
      }
      wx.setStorageSync('debt_data', dataToSave)
    } catch (e) {
      console.error('Save error:', e)
    }
  }
})
