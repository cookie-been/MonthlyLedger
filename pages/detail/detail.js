var app = getApp()

Page({
  data: {
    channel: {},
    showRepayModal: false,
    repayAmount: '',
    repayNote: ''
  },

  onLoad: function(options) {
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
      this.setData({ channel: channel })
      wx.setNavigationBarTitle({ title: channel.name })
    }
    if (options.action === 'repay') {
      this.openRepayModal()
    }
  },

  formatMoney: function(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
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

    var now = new Date()
    var timeStr = now.getFullYear() + '-' + 
      (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1) + '-' + 
      (now.getDate() < 10 ? '0' : '') + now.getDate() + ' ' +
      (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' +
      (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ':' +
      (now.getSeconds() < 10 ? '0' : '') + now.getSeconds()

    app.globalData.records.unshift({
      id: Date.now(),
      channelId: channel.id,
      name: channel.name,
      amount: amount,
      time: timeStr,
      note: note
    })

    app.saveData()
    this.setData({ channel: channel, showRepayModal: false })

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
    for (var i = 0; i < achievements.length; i++) {
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
