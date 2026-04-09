var app = getApp()
var util = require('../../utils/util.js')

Page({
  data: {
    channel: {},
    showRepayModal: false,
    repayAmount: '',
    repayNote: '',
    remainingDisplay: '0.00',
    totalAmountDisplay: '0.00',
    paidDisplay: '0.00',
    monthlyPaymentDisplay: '0.00',
    periodList: []
  },

  onLoad: function(options) {
    var that = this
    var id = parseInt(options.id)
    var channels = app.globalData.channels
    var channel = null
    for (var i = 0; i < channels.length; i++) {
      if (channels[i].id === id) {
        channel = channels[i]
        break
      }
    }
    if (channel) {
      var paidFromAmount = channel.totalAmount - channel.remaining
      var paidFromPeriods = (channel.paidPeriods || 0) * channel.monthlyPayment
      var paidAmount = Math.min(paidFromAmount, paidFromPeriods)
      if (paidFromPeriods > paidFromAmount) {
        paidAmount = paidFromPeriods
      }
      
      // 生成从1开始的期数列表
      var periodList = []
      for (var p = 1; p <= channel.totalPeriods; p++) {
        periodList.push(p)
      }
      
      this.setData({ 
        channel: channel,
        periodList: periodList,
        remainingDisplay: this.formatMoney(channel.remaining),
        totalAmountDisplay: this.formatMoney(channel.totalAmount),
        paidDisplay: this.formatMoney(paidAmount),
        monthlyPaymentDisplay: this.formatMoney(channel.monthlyPayment)
      })
      wx.setNavigationBarTitle({ title: channel.name })
    }
    if (options.action === 'repay') {
      this.openRepayModal()
    }
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

  goBack: function() {
    wx.navigateBack()
  },

  editChannel: function() {
    wx.navigateTo({ url: '/pages/add/add?id=' + this.data.channel.id })
  },

  openRepayModal: function() {
    this.setData({
      showRepayModal: true,
      repayAmount: String(this.data.channel.monthlyPayment),
      repayNote: ''
    })
  },

  closeRepayModal: function() {
    this.setData({ showRepayModal: false })
  },

  onRepayInput: function(e) {
    this.setData({ repayAmount: e.detail.value })
  },

  onNoteInput: function(e) {
    this.setData({ repayNote: e.detail.value })
  },

  confirmRepay: function() {
    var amount = parseFloat(this.data.repayAmount) || 0
    var rawNote = this.data.repayNote || ''
    var note = rawNote.replace(/^\s+|\s+$/g, '')
    
    if (amount <= 0) {
      wx.showToast({ title: '请输入还款金额', icon: 'none' })
      return
    }
    if (amount > this.data.channel.remaining) {
      wx.showToast({ title: '还款金额不能超过剩余欠款', icon: 'none' })
      return
    }

    var channel = this.data.channel
    channel.remaining = Math.max(0, channel.remaining - amount)
    channel.progress = Math.round(((channel.totalAmount - channel.remaining) / channel.totalAmount) * 100)
    if (channel.totalPeriods > 0) {
      channel.paidPeriods = Math.min(channel.totalPeriods, channel.paidPeriods + 1)
    }

    app.globalData.records.unshift({
      id: new Date().getTime(),
      channelId: channel.id,
      name: channel.name,
      amount: amount,
      time: util.formatTime(new Date()),
      note: note
    })

    app.saveData()
    var paidFromAmount = channel.totalAmount - channel.remaining
    var paidFromPeriods = (channel.paidPeriods || 0) * channel.monthlyPayment
    var paidAmount = Math.min(paidFromAmount, paidFromPeriods)
    if (paidFromPeriods > paidFromAmount) {
      paidAmount = paidFromPeriods
    }
    this.setData({ 
      channel: channel, 
      showRepayModal: false,
      paidDisplay: this.formatMoney(paidAmount)
    })

    if (channel.remaining === 0) {
      this.checkAchievements()
      wx.showModal({
        title: '🎉 恭喜！',
        content: channel.name + ' 已还清！',
        showCancel: false
      })
    } else {
      wx.showToast({ title: '还款成功', icon: 'success' })
    }
  },

  checkAchievements: function() {
    var achievements = app.globalData.achievements
    var newOnes = []
    var hasFirstClear = false
    var hasAllClear = false
    var i
    for (i = 0; i < achievements.length; i++) {
      if (achievements[i] === 'first_clear') hasFirstClear = true
      if (achievements[i] === 'all_clear') hasAllClear = true
    }
    if (!hasFirstClear) newOnes.push('first_clear')
    
    var remaining = 0
    for (var j = 0; j < app.globalData.channels.length; j++) {
      remaining += app.globalData.channels[j].remaining
    }
    if (remaining === 0 && !hasAllClear) newOnes.push('all_clear')
    
    if (newOnes.length > 0) {
      app.globalData.achievements = achievements.concat(newOnes)
      app.saveData()
    }
  }
})
