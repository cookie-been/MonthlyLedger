var app = getApp()

Page({
  data: {
    channels: [],
    sortedChannels: [],
    warnings: [],
    hideAmount: false,
    sortType: 'amountDesc',
    sortLabel: '金额↓',
    showQuickMenu: false,
    quickChannel: null,
    totalDebt: 0,
    monthRepay: 0,
    clearDays: 0,
    activeCount: 0,
    progress: 0,
    motivationText: ''
  },

  onShow: function() {
    this.loadData()
  },

  loadData: function() {
    var g = app.globalData
    var channels = g.channels || []
    var settings = g.settings || {}
    var that = this

    var active = channels.filter(function(c) { return c.remaining > 0 })
    var total = active.reduce(function(s, c) { return s + c.remaining }, 0)
    var totalOrig = channels.reduce(function(s, c) { return s + c.totalAmount }, 0)
    var paid = totalOrig - total
    var progress = totalOrig > 0 ? Math.round((paid / totalOrig) * 100) : 0
    var monthly = active.reduce(function(s, c) { return s + c.monthlyPayment }, 0)
    var clearDays = monthly > 0 ? Math.ceil(total / monthly * 30) : 0

    var today = new Date()
    var warnings = active.map(function(c) {
      var repaymentDate = new Date(today.getFullYear(), today.getMonth(), c.repaymentDay)
      var diff = Math.ceil((repaymentDate - today) / (1000 * 60 * 60 * 24))
      var levelClass = 'level-info', dayClass = 'info', dayText = '还有' + diff + '天到期'
      if (diff < 0) { levelClass = 'level-overdue'; dayClass = 'overdue'; dayText = '已逾期' + (-diff) + '天' }
      else if (diff === 0) { levelClass = 'level-urgent'; dayClass = 'urgent'; dayText = '今天到期' }
      else if (diff === 1) { levelClass = 'level-urgent'; dayClass = 'urgent'; dayText = '明天到期' }
      else if (diff <= 3) { levelClass = 'level-warning'; dayClass = 'warning' }
      return { id: c.id, name: c.name, type: c.type, totalAmount: c.totalAmount, monthlyPayment: c.monthlyPayment, remaining: c.remaining, repaymentDay: c.repaymentDay, progress: c.progress, interestRate: c.interestRate, totalPeriods: c.totalPeriods, paidPeriods: c.paidPeriods, daysUntil: diff, levelClass: levelClass, dayClass: dayClass, dayText: dayText }
    }).filter(function(c) { return c.daysUntil <= 3 }).sort(function(a, b) { return a.daysUntil - b.daysUntil })

    var motivationText = ''
    if (channels.length > 0) {
      if (progress === 0) motivationText = '万事开头难，你已经迈出第一步了！'
      else if (progress < 30) motivationText = '每一笔还款都是向自由迈进的一步'
      else if (progress < 70) motivationText = '💪 再坚持' + Math.ceil(clearDays / 30) + '个月就上岸了！'
      else if (progress < 100) motivationText = '胜利在望！只剩最后一公里了'
      else motivationText = '🎊 恭喜！你已还清所有债务！'
    }

    that.setData({
      channels: channels,
      hideAmount: settings.hideAmount || false,
      totalDebt: total,
      monthRepay: monthly,
      clearDays: clearDays,
      activeCount: active.length,
      progress: progress,
      warnings: warnings,
      motivationText: motivationText
    })

    this.sortChannels()
  },

  sortChannels: function() {
    var that = this
    var sorted = this.data.channels.filter(function(c) { return c.remaining > 0 })
    var sortType = this.data.sortType

    if (sortType === 'amountDesc') sorted.sort(function(a, b) { return b.remaining - a.remaining })
    else if (sortType === 'amountAsc') sorted.sort(function(a, b) { return a.remaining - b.remaining })
    else if (sortType === 'dateAsc') sorted.sort(function(a, b) { return a.repaymentDay - b.repaymentDay })
    else if (sortType === 'type') sorted.sort(function(a, b) { return a.type.localeCompare(b.type) })

    var typeMap = { credit_card: '信用卡', huabei: '花呗', jiebei: '借呗', net_loan: '网贷', other: '其他' }
    sorted = sorted.map(function(c) {
      return { id: c.id, name: c.name, type: c.type, totalAmount: c.totalAmount, monthlyPayment: c.monthlyPayment, remaining: c.remaining, repaymentDay: c.repaymentDay, progress: c.progress, interestRate: c.interestRate, totalPeriods: c.totalPeriods, paidPeriods: c.paidPeriods, typeName: typeMap[c.type] || '其他', overdueDays: that.getOverdueDays(c) }
    })

    this.setData({ sortedChannels: sorted })
  },

  getOverdueDays: function(channel) {
    var today = new Date()
    var repaymentDate = new Date(today.getFullYear(), today.getMonth(), channel.repaymentDay)
    var diff = Math.ceil((repaymentDate - today) / (1000 * 60 * 60 * 24))
    return diff < 0 ? -diff : 0
  },

  toggleAmount: function() {
    var hide = !this.data.hideAmount
    app.globalData.settings.hideAmount = hide
    app.saveData()
    this.setData({ hideAmount: hide })
  },

  toggleSort: function() {
    var types = ['amountDesc', 'amountAsc', 'dateAsc', 'type']
    var labels = ['金额↓', '金额↑', '日期↑', '类型']
    var idx = (types.indexOf(this.data.sortType) + 1) % types.length
    this.setData({ sortType: types[idx], sortLabel: labels[idx] })
    this.sortChannels()
  },

  formatMoney: function(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  goDetail: function(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  goAdd: function() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  goSettings: function() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  showNotification: function() {
    wx.showToast({ title: '暂无新通知', icon: 'none' })
  },

  showQuickMenu: function(e) {
    var channel = e.currentTarget.dataset.channel
    this.setData({ showQuickMenu: true, quickChannel: channel })
  },

  closeQuickMenu: function() {
    this.setData({ showQuickMenu: false })
  },

  quickRepay: function() {
    this.closeQuickMenu()
    var qc = this.data.quickChannel
    if (qc) {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + qc.id + '&action=repay' })
    }
  },

  quickEdit: function() {
    this.closeQuickMenu()
    var qc = this.data.quickChannel
    if (qc) {
      wx.navigateTo({ url: '/pages/add/add?id=' + qc.id })
    }
  },

  quickDelete: function() {
    var that = this
    this.closeQuickMenu()
    var ch = this.data.quickChannel
    if (!ch) return
    wx.showModal({
      title: '确认删除',
      content: '确定要删除"' + ch.name + '"吗？',
      success: function(res) {
        if (res.confirm) {
          app.globalData.channels = app.globalData.channels.filter(function(c) { return c.id !== ch.id })
          app.globalData.records = app.globalData.records.filter(function(r) { return r.channelId !== ch.id })
          app.saveData()
          that.loadData()
          wx.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  }
})
