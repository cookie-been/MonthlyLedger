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
    createdAt: ''
  },

  onLaunch: function() {
    var that = this
    try {
      var saved = wx.getStorageSync('debt_data')
      if (saved && saved.channels && saved.channels.length > 0) {
        that.globalData.channels = saved.channels
        that.globalData.records = saved.records || []
        that.globalData.settings = saved.settings || that.globalData.settings
        that.globalData.achievements = saved.achievements || []
        that.globalData.createdAt = saved.createdAt || ''
      } else {
        that._initDemoData()
      }
    } catch (e) {
      console.error('Init error:', e)
      that._initDemoData()
    }
  },

  _initDemoData: function() {
    this.globalData.channels = [
      { id: 1, name: '招商信用卡', type: 'credit_card', totalAmount: 10000, monthlyPayment: 1500, remaining: 5800, repaymentDay: 15, progress: 42, interestRate: 0, totalPeriods: 0, paidPeriods: 0 },
      { id: 2, name: '支付宝花呗', type: 'huabei', totalAmount: 4000, monthlyPayment: 800, remaining: 3200, repaymentDay: 10, progress: 20, interestRate: 0, totalPeriods: 0, paidPeriods: 0 },
      { id: 3, name: '支付宝借呗', type: 'jiebei', totalAmount: 5000, monthlyPayment: 600, remaining: 2500, repaymentDay: 20, progress: 50, interestRate: 14.6, totalPeriods: 12, paidPeriods: 6 },
      { id: 4, name: '网贷平台', type: 'net_loan', totalAmount: 2000, monthlyPayment: 1080, remaining: 1080, repaymentDay: 25, progress: 46, interestRate: 18, totalPeriods: 0, paidPeriods: 0 }
    ]
    this.globalData.records = [
      { id: 1, channelId: 2, name: '支付宝花呗', amount: 800, time: '2024-02-10 09:30:00', note: '第一期' },
      { id: 2, channelId: 1, name: '招商信用卡', amount: 1500, time: '2024-02-15 14:20:00', note: '' },
      { id: 3, channelId: 3, name: '支付宝借呗', amount: 600, time: '2024-02-20 10:15:00', note: '第7期' }
    ]
    this.globalData.achievements = ['first_repay']
    this.globalData.createdAt = util.formatTime(new Date())
    this.saveData()
  },

  saveData: function() {
    try {
      wx.setStorageSync('debt_data', this.globalData)
    } catch (e) {
      console.error('Save error:', e)
    }
  }
})
