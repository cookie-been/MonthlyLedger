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
    totalDebtDisplay: '0.00',
    monthRepay: 0,
    monthRepayDisplay: '0.00',
    clearDays: 0,
    activeCount: 0,
    progress: 0,
    motivationText: '',
    // 数据可视化
    pieData: []
  },

  onShow: function() {
    this.loadData()
  },

  onReady: function() {
    this.renderVisuals()
  },

  // 计算canvas实际像素尺寸
  getCanvasSize: function() {
    var screenWidth = 375 // 默认值
    try {
      var info = wx.getWindowInfo()
      screenWidth = info.windowWidth || 375
    } catch(e) {}
    // 400rpx对应的px值: rpx * (screenWidth / 750)
    return Math.floor(400 * (screenWidth / 750))
  },

  loadData: function() {
    var g = app.globalData
    var channels = g.channels || []
    var settings = g.settings || {}
    var that = this

    var active = channels.filter(function(c) { return c.remaining > 0 })
    var total = active.reduce(function(s, c) { return s + c.remaining }, 0)
    var totalOrig = channels.reduce(function(s, c) { return s + c.totalAmount }, 0)
    
    // 计算还款进度（金额进度：已还金额 / 总欠款）
    var paid = 0
    var totalOrig = channels.reduce(function(s, c) { return s + (c.totalAmount || 0) }, 0)
    
    for (var pi = 0; pi < channels.length; pi++) {
      var ch = channels[pi]
      if (ch.totalPeriods && ch.totalPeriods > 0) {
        // 有分期信息，用期数 × 月还款
        paid += (ch.paidPeriods || 0) * (ch.monthlyPayment || 0)
      } else {
        // 没有分期信息，用金额差
        paid += (ch.totalAmount - ch.remaining)
      }
    }
    
    // 总还款进度 = 已还金额 / 总欠款
    var progress = totalOrig > 0 ? Math.round((paid / totalOrig) * 100) : 0
    progress = Math.min(100, Math.max(0, progress))
    var monthly = active.reduce(function(s, c) { return s + (c.monthlyPayment || 0) }, 0)
    var monthlyTotal = monthly
    
    // 根据日期计算清零天数（真实日期，考虑多个账单不同还款日）
    var clearDays = 0
    if (total > 0 && monthlyTotal > 0) {
      var today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // 计算每个账单的最晚还清日期
      var maxDays = 0
      
      for (var i = 0; i < active.length; i++) {
        var ch = active[i]
        var remaining = ch.remaining || 0
        var monthlyPay = ch.monthlyPayment || 0
        
        if (remaining > 0 && monthlyPay > 0) {
          // 从下个月还款日开始计算真实天数
          var nextRepay = new Date(today.getFullYear(), today.getMonth(), ch.repaymentDay)
          if (nextRepay <= today) {
            nextRepay.setMonth(nextRepay.getMonth() + 1)
          }
          
          var currentRemaining = remaining
          var days = 0
          
          while (currentRemaining > 0) {
            // 本期到下期的天数
            var nextMonth = new Date(nextRepay)
            nextMonth.setMonth(nextMonth.getMonth() + 1)
            var daysInPeriod = Math.ceil((nextMonth - nextRepay) / (1000 * 60 * 60 * 24))
            
            // 本期还款后剩余
            currentRemaining -= monthlyPay
            days += daysInPeriod
            nextRepay = nextMonth
            
            // 防止无限循环
            if (days > 3650) break
          }
          
          // 取所有账单中最大的天数（以最后还清的为准）
          if (days > maxDays) {
            maxDays = days
          }
        }
      }
      
      clearDays = Math.round(maxDays)
    }

    var today = new Date()
    var that = this
    var warnings = active.map(function(c) {
      var repaymentDate = new Date(today.getFullYear(), today.getMonth(), c.repaymentDay)
      var diff = Math.ceil((repaymentDate - today) / (1000 * 60 * 60 * 24))
      var levelClass = 'level-info', dayClass = 'info', dayText = '还有' + diff + '天到期'
      if (diff < 0) { levelClass = 'level-overdue'; dayClass = 'overdue'; dayText = '已逾期' + (-diff) + '天' }
      else if (diff === 0) { levelClass = 'level-urgent'; dayClass = 'urgent'; dayText = '今天到期' }
      else if (diff === 1) { levelClass = 'level-urgent'; dayClass = 'urgent'; dayText = '明天到期' }
      else if (diff <= 3) { levelClass = 'level-warning'; dayClass = 'warning' }
      return { id: c.id, name: c.name, type: c.type, totalAmount: c.totalAmount, monthlyPayment: c.monthlyPayment, monthlyPaymentDisplay: that.formatMoney(c.monthlyPayment), remaining: c.remaining, repaymentDay: c.repaymentDay, progress: c.progress, interestRate: c.interestRate, totalPeriods: c.totalPeriods, paidPeriods: c.paidPeriods, daysUntil: diff, levelClass: levelClass, dayClass: dayClass, dayText: dayText }
    }).filter(function(c) { return c.daysUntil <= 3 }).sort(function(a, b) { return a.daysUntil - b.daysUntil })

    var motivationText = ''
    
    if (channels.length > 0) {
      // 金额进度
      if (progress === 0) motivationText = '万事开头难，你已经迈出第一步了！'
      else if (progress < 30) motivationText = '每一笔还款都是向自由迈进的一步'
      else if (progress < 70) motivationText = '💪 再坚持' + Math.ceil(clearDays / 30) + '个月就上岸了！'
      else if (progress < 100) motivationText = '胜利在望！只剩最后一公里了'
      else motivationText = '🎊 恭喜！你已还清所有账单！'
    }
    
    that.setData({
      channels: channels,
      hideAmount: settings.hideAmount || false,
      totalDebt: total,
      totalDebtDisplay: that.formatMoney(total),
      monthRepay: monthly,
      monthRepayDisplay: that.formatMoney(monthly),
      clearDays: clearDays,
      activeCount: active.length,
      progress: progress,
      warnings: warnings,
      motivationText: motivationText,
      pieData: that.generatePieData(channels)
    })

    this.sortChannels()
    this.renderVisuals()
  },

  generatePieData: function(channels) {
    var colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#9B59B6', '#3498DB', '#E74C3C']
    var total = 0
    var result = []
    
    // 按每个账单显示
    for (var i = 0; i < channels.length; i++) {
      var ch = channels[i]
      if (ch.remaining > 0) {
        total += ch.remaining
        result.push({
          name: ch.name,
          value: ch.remaining,
          color: colors[i % colors.length]
        })
      }
    }
    
    // 计算百分比
    for (var j = 0; j < result.length; j++) {
      result[j].percentage = total > 0 ? Math.round((result[j].value / total) * 100) + '%' : '0%'
    }
    
    return result
  },

  // 渲染图表
  renderVisuals: function() {
    var that = this
    var channels = app.globalData.channels || []
    
    var pieData = this.generatePieData(channels)
    
    this.setData({
      pieData: pieData
    })
    
    // 延迟绘制，等待canvas初始化
    setTimeout(function() {
      that.drawPieChart()
    }, 100)
  },

  // 绘制饼图
  drawPieChart: function() {
    var data = this.data.pieData
    if (!data || data.length === 0) return
    
    var ctx = wx.createCanvasContext('pieCanvas', this)
    // 动态计算canvas尺寸
    var size = this.getCanvasSize()
    
    var centerX = size / 2
    var centerY = size / 2
    var outerRadius = size / 2 - 8
    var innerRadius = outerRadius * 0.6
    
    var total = 0
    for (var i = 0; i < data.length; i++) {
      total += data[i].value || 0
    }
    
    var colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#9B59B6', '#3498DB']
    var startAngle = -Math.PI / 2
    
    for (var i = 0; i < data.length; i++) {
      var ratio = total > 0 ? (data[i].value / total) : 0
      var endAngle = startAngle + ratio * 2 * Math.PI
      
      // 绘制扇形
      ctx.beginPath()
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
      ctx.closePath()
      ctx.setFillStyle(colors[i % colors.length])
      ctx.fill()
      
      startAngle = endAngle
    }
    
    // 中心文字 - 根据尺寸动态调整
    var fontSize = Math.max(20, Math.floor(size * 0.1))
    var labelSize = Math.max(14, Math.floor(size * 0.07))
    ctx.setFontSize(fontSize)
    ctx.setFillStyle('#2C3E50')
    ctx.setTextAlign('center')
    ctx.fillText(this.formatMoney(total), centerX, centerY - 2)
    ctx.setFontSize(labelSize)
    ctx.setFillStyle('#718096')
    ctx.fillText('总账单', centerX, centerY + fontSize)
    
    ctx.draw()
  },

  switchVisualTab: function(e) {
    this.setData({ visualTab: e.currentTarget.dataset.type })
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

  sortChannels: function() {
    var that = this
    var sorted = this.data.channels.filter(function(c) { return c.remaining > 0 })
    var sortType = this.data.sortType

    if (sortType === 'amountDesc') sorted.sort(function(a, b) { return b.remaining - a.remaining })
    else if (sortType === 'amountAsc') sorted.sort(function(a, b) { return a.remaining - b.remaining })
    else if (sortType === 'dateAsc') sorted.sort(function(a, b) { return a.repaymentDay - b.repaymentDay })
    else if (sortType === 'type') sorted.sort(function(a, b) { return a.type.localeCompare(b.type) })

    var typeMap = { credit_card: '信用卡', bank_loan: '银行贷款', company_loan: '企业贷款', personal_loan: '个人贷款', other: '其它' }
    var that = this
    sorted = sorted.map(function(c) {
      return { 
        id: c.id, 
        name: c.name, 
        type: c.type, 
        totalAmount: c.totalAmount, 
        monthlyPayment: c.monthlyPayment, 
        remaining: c.remaining, 
        remainingDisplay: that.formatMoney(c.remaining),
        repaymentDay: c.repaymentDay, 
        progress: c.progress, 
        interestRate: c.interestRate, 
        totalPeriods: c.totalPeriods, 
        paidPeriods: c.paidPeriods, 
        typeName: typeMap[c.type] || '其他', 
        overdueDays: that.getOverdueDays(c) 
      }
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

  formatMoney: function(val) {
    if (!val && val !== 0) return '0.00'
    return val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
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

  showNotifications: function() {
    var that = this
    var warnings = this.data.warnings
    if (warnings.length === 0) {
      wx.showToast({ title: '暂无还款提醒', icon: 'none' })
      return
    }
    var content = ''
    for (var i = 0; i < warnings.length; i++) {
      content += warnings[i].name + ': ' + warnings[i].dayText + '\n'
    }
    wx.showModal({
      title: '还款提醒',
      content: content,
      showCancel: false
    })
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
