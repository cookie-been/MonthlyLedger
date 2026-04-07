const app = getApp()

Page({
  data: {
    channel: {},
    showRepayModal: false,
    repayAmount: '',
    repayNote: ''
  },

  onLoad(options) {
    const id = parseInt(options.id)
    const channel = app.globalData.channels.find(c => c.id === id)
    if (channel) {
      this.setData({ channel })
      wx.setNavigationBarTitle({ title: channel.name })
    }
    if (options.action === 'repay') {
      this.openRepayModal()
    }
  },

  formatMoney(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  goBack() {
    wx.navigateBack()
  },

  editChannel() {
    wx.navigateTo({ url: `/pages/add/add?id=${this.data.channel.id}` })
  },

  openRepayModal() {
    this.setData({
      showRepayModal: true,
      repayAmount: String(this.data.channel.monthlyPayment),
      repayNote: ''
    })
  },

  closeRepayModal() {
    this.setData({ showRepayModal: false })
  },

  onRepayInput(e) {
    this.setData({ repayAmount: e.detail.value })
  },

  onNoteInput(e) {
    this.setData({ repayNote: e.detail.value })
  },

  confirmRepay() {
    const amount = parseFloat(this.data.repayAmount) || 0
    const note = this.data.repayNote.trim()
    
    if (amount <= 0) {
      wx.showToast({ title: '请输入还款金额', icon: 'none' })
      return
    }
    if (amount > this.data.channel.remaining) {
      wx.showToast({ title: '还款金额不能超过剩余欠款', icon: 'none' })
      return
    }

    const channel = this.data.channel
    channel.remaining = Math.max(0, channel.remaining - amount)
    channel.progress = Math.round(((channel.totalAmount - channel.remaining) / channel.totalAmount) * 100)
    if (channel.totalPeriods > 0) {
      channel.paidPeriods = Math.min(channel.totalPeriods, channel.paidPeriods + 1)
    }

    app.globalData.records.unshift({
      id: Date.now(),
      channelId: channel.id,
      name: channel.name,
      amount,
      time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      note
    })

    app.saveData()
    this.setData({ channel, showRepayModal: false })

    if (channel.remaining === 0) {
      this.checkAchievements()
      wx.showModal({
        title: '🎉 恭喜！',
        content: `${channel.name} 已还清！`,
        showCancel: false
      })
    } else {
      wx.showToast({ title: '还款成功', icon: 'success' })
    }
  },

  checkAchievements() {
    const achievements = app.globalData.achievements
    const newOnes = []
    if (!achievements.includes('first_clear')) newOnes.push('first_clear')
    const remaining = app.globalData.channels.reduce((s, c) => s + c.remaining, 0)
    if (remaining === 0 && !achievements.includes('all_clear')) newOnes.push('all_clear')
    if (newOnes.length > 0) {
      app.globalData.achievements = [...achievements, ...newOnes]
      app.saveData()
    }
  }
})