const app = getApp()

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

  onShow() {
    this.loadData()
  },

  loadData() {
    const g = app.globalData
    const channels = g.channels || []
    const settings = g.settings || {}
    
    const active = channels.filter(c => c.remaining > 0)
    const total = active.reduce((s, c) => s + c.remaining, 0)
    const totalOrig = channels.reduce((s, c) => s + c.totalAmount, 0)
    const paid = totalOrig - total
    const progress = totalOrig > 0 ? Math.round((paid / totalOrig) * 100) : 0
    const monthly = active.reduce((s, c) => s + c.monthlyPayment, 0)
    const clearDays = monthly > 0 ? Math.ceil(total / monthly * 30) : 0

    const today = new Date()
    const warnings = active.map(c => {
      const repaymentDate = new Date(today.getFullYear(), today.getMonth(), c.repaymentDay)
      const diff = Math.ceil((repaymentDate - today) / (1000 * 60 * 60 * 24))
      let levelClass = 'level-info', dayClass = 'info', dayText = `还有${diff}天到期`
      if (diff < 0) { levelClass = 'level-overdue'; dayClass = 'overdue'; dayText = `已逾期${-diff}天` }
      else if (diff === 0) { levelClass = 'level-urgent'; dayClass = 'urgent'; dayText = '今天到期' }
      else if (diff === 1) { levelClass = 'level-urgent'; dayClass = 'urgent'; dayText = '明天到期' }
      else if (diff <= 3) { levelClass = 'level-warning'; dayClass = 'warning' }
      return { ...c, daysUntil: diff, levelClass, dayClass, dayText }
    }).filter(c => c.daysUntil <= 3).sort((a, b) => a.daysUntil - b.daysUntil)

    let motivationText = ''
    if (channels.length > 0) {
      if (progress === 0) motivationText = '万事开头难，你已经迈出第一步了！'
      else if (progress < 30) motivationText = '每一笔还款都是向自由迈进的一步'
      else if (progress < 70) motivationText = `💪 再坚持${Math.ceil(clearDays / 30)}个月就上岸了！`
      else if (progress < 100) motivationText = '胜利在望！只剩最后一公里了'
      else motivationText = '🎊 恭喜！你已还清所有债务！'
    }

    this.setData({
      channels,
      hideAmount: settings.hideAmount || false,
      totalDebt: total,
      monthRepay: monthly,
      clearDays,
      activeCount: active.length,
      progress,
      warnings,
      motivationText
    })

    this.sortChannels()
  },

  sortChannels() {
    let sorted = [...this.data.channels].filter(c => c.remaining > 0)
    const { sortType } = this.data
    
    if (sortType === 'amountDesc') sorted.sort((a, b) => b.remaining - a.remaining)
    else if (sortType === 'amountAsc') sorted.sort((a, b) => a.remaining - b.remaining)
    else if (sortType === 'dateAsc') sorted.sort((a, b) => a.repaymentDay - b.repaymentDay)
    else if (sortType === 'type') sorted.sort((a, b) => a.type.localeCompare(b.type))

    const typeMap = { credit_card: '信用卡', huabei: '花呗', jiebei: '借呗', net_loan: '网贷', other: '其他' }
    sorted = sorted.map(c => ({
      ...c,
      typeName: typeMap[c.type] || '其他',
      overdueDays: this.getOverdueDays(c)
    }))

    this.setData({ sortedChannels: sorted })
  },

  getOverdueDays(channel) {
    const today = new Date()
    const repaymentDate = new Date(today.getFullYear(), today.getMonth(), channel.repaymentDay)
    const diff = Math.ceil((repaymentDate - today) / (1000 * 60 * 60 * 24))
    return diff < 0 ? -diff : 0
  },

  toggleAmount() {
    const hide = !this.data.hideAmount
    app.globalData.settings.hideAmount = hide
    app.saveData()
    this.setData({ hideAmount: hide })
  },

  toggleSort() {
    const types = ['amountDesc', 'amountAsc', 'dateAsc', 'type']
    const labels = ['金额↓', '金额↑', '日期↑', '类型']
    const idx = (types.indexOf(this.data.sortType) + 1) % types.length
    this.setData({ sortType: types[idx], sortLabel: labels[idx] })
    this.sortChannels()
  },

  formatMoney(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  showQuickMenu(e) {
    const channel = e.currentTarget.dataset.channel
    this.setData({ showQuickMenu: true, quickChannel: channel })
  },

  closeQuickMenu() {
    this.setData({ showQuickMenu: false })
  },

  quickRepay() {
    this.closeQuickMenu()
    if (this.data.quickChannel) {
      wx.navigateTo({ url: `/pages/detail/detail?id=${this.data.quickChannel.id}&action=repay` })
    }
  },

  quickEdit() {
    this.closeQuickMenu()
    if (this.data.quickChannel) {
      wx.navigateTo({ url: `/pages/add/add?id=${this.data.quickChannel.id}` })
    }
  },

  quickDelete() {
    this.closeQuickMenu()
    const ch = this.data.quickChannel
    if (!ch) return
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${ch.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          app.globalData.channels = app.globalData.channels.filter(c => c.id !== ch.id)
          app.globalData.records = app.globalData.records.filter(r => r.channelId !== ch.id)
          app.saveData()
          this.loadData()
          wx.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  }
})