var app = getApp()
var util = require('../../utils/util.js')

Page({
  data: {
    totalDebt: 0,
    totalOriginal: 0,
    totalPaid: 0,
    progressPercent: 0,
    monthlyPayment: 0,
    avgInterestRate: 0,
    clearMonths: 0,
    clearDate: '-',
    typeDistribution: [],
    monthlyTrend: [],
    recentRecords: [],
    topDebtChannel: null,
    warningChannels: [],
    // 分期统计
    totalPeriods: 0,
    paidPeriods: 0,
    remainingPeriods: 0,
    avgMonthlyPayment: 0,
    // 分期进度分析
    installmentStatus: {},
    periodProgress: 0
  },

  onShow: function() {
    this.loadAnalytics()
  },

  loadAnalytics: function() {
    var that = this
    var channels = app.globalData.channels || []
    var records = app.globalData.records || []

    var totalDebt = 0
    var totalOriginal = 0
    var totalPaid = 0
    var totalInterest = 0
    var interestCount = 0
    var monthlyPayment = 0
    var typeMap = {}
    var warningChannels = []
    var totalPeriods = 0
    var paidPeriods = 0

    for (var i = 0; i < channels.length; i++) {
      var ch = channels[i]
      totalOriginal += ch.totalAmount || 0
      totalDebt += ch.remaining || 0
      
      // 按已还期数计算已还金额
      if (ch.paidPeriods && ch.paidPeriods > 0) {
        totalPaid += ch.paidPeriods * (ch.monthlyPayment || 0)
      } else {
        totalPaid += ((ch.totalAmount || 0) - (ch.remaining || 0))
      }
      monthlyPayment += ch.monthlyPayment || 0

      // 统计分期
      if (ch.totalPeriods > 0) {
        totalPeriods += ch.totalPeriods
        paidPeriods += (ch.paidPeriods || 0)
      }

      if (ch.interestRate > 0) {
        totalInterest += ch.interestRate
        interestCount++
      }

      if (ch.remaining > 0) {
        var typeName = this.getTypeName(ch.type)
        typeMap[typeName] = (typeMap[typeName] || 0) + (ch.remaining || 0)
      }

      var daysUntil = this.getDaysUntil(ch.repaymentDay)
      if (daysUntil <= 3 && ch.remaining > 0) {
        warningChannels.push({
          name: ch.name,
          daysUntil: daysUntil,
          amount: ch.remaining
        })
      }
    }

    var progressPercent = totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0
    var avgInterestRate = interestCount > 0 ? (totalInterest / interestCount).toFixed(1) : 0
    var clearMonths = monthlyPayment > 0 ? Math.ceil(totalDebt / monthlyPayment) : 0
    var clearDate = '-'
    if (clearMonths > 0) {
      var d = new Date()
      d.setMonth(d.getMonth() + clearMonths)
      clearDate = (d.getFullYear()) + '年' + (d.getMonth() + 1) + '月'
    }

    // 平均月还款
    var activeCount = 0
    for (var ac = 0; ac < channels.length; ac++) {
      if (channels[ac].remaining > 0) activeCount++
    }
    var avgMonthlyPayment = activeCount > 0 ? Math.round(monthlyPayment / activeCount) : 0

    // 分期进度分析
    var installmentStatus = this.calculateInstallmentStatus(channels, paidPeriods)
    var periodProgress = totalPeriods > 0 ? Math.round((paidPeriods / totalPeriods) * 100) : 0

    var typeDistribution = []
    var typeNames = Object.keys(typeMap)
    for (var j = 0; j < typeNames.length; j++) {
      typeDistribution.push({
        name: typeNames[j],
        amount: typeMap[typeNames[j]],
        amountDisplay: this.formatMoney(typeMap[typeNames[j]]),
        percent: totalDebt > 0 ? Math.round((typeMap[typeNames[j]] / totalDebt) * 100) : 0
      })
    }
    typeDistribution.sort(function(a, b) { return b.amount - a.amount })

    var sortedChannels = []
    for (var sc = 0; sc < channels.length; sc++) {
      if (channels[sc].remaining > 0) sortedChannels.push(channels[sc])
    }
    sortedChannels.sort(function(a, b) { return b.remaining - a.remaining })
    var topDebtChannel = sortedChannels.length > 0 ? sortedChannels[0] : null
    if (topDebtChannel) {
      topDebtChannel.remainingDisplay = this.formatMoney(topDebtChannel.remaining || 0)
      topDebtChannel.totalAmountDisplay = this.formatMoney(topDebtChannel.totalAmount || 0)
    }

    var recentRecords = []
    for (var rr = 0; rr < records.length && rr < 5; rr++) {
      recentRecords.push({
        name: records[rr].name,
        amount: records[rr].amount,
        amountDisplay: this.formatMoney(records[rr].amount || 0),
        time: records[rr].time,
        note: records[rr].note
      })
    }

    this.setData({
      totalDebt: totalDebt,
      totalDebtDisplay: this.formatMoney(totalDebt),
      totalOriginal: totalOriginal,
      totalOriginalDisplay: this.formatMoney(totalOriginal),
      totalPaid: totalPaid,
      totalPaidDisplay: this.formatMoney(totalPaid),
      progressPercent: progressPercent,
      monthlyPayment: monthlyPayment,
      monthlyPaymentDisplay: this.formatMoney(monthlyPayment),
      avgInterestRate: avgInterestRate,
      clearMonths: clearMonths,
      clearDate: clearDate,
      typeDistribution: typeDistribution,
      topDebtChannel: topDebtChannel,
      warningChannels: warningChannels,
      recentRecords: recentRecords,
      totalPeriods: totalPeriods,
      paidPeriods: paidPeriods,
      remainingPeriods: totalPeriods - paidPeriods,
      avgMonthlyPayment: avgMonthlyPayment,
      avgMonthlyPaymentDisplay: this.formatMoney(avgMonthlyPayment),
      installmentStatus: installmentStatus,
      periodProgress: periodProgress
    })
  },

  calculateInstallmentStatus: function(channels, paidPeriods) {
    var totalPeriods = 0
    var createdAt = app.globalData.createdAt
    
    // 计算从创建到现在经过的月份数
    var monthsPassed = 1
    if (createdAt) {
      var created = util.parseDate(createdAt)
      var now = new Date()
      monthsPassed = Math.max(1, (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth()) + 1)
    }
    
    // 统计有分期的渠道
    for (var i = 0; i < channels.length; i++) {
      if (channels[i].totalPeriods > 0) {
        totalPeriods += channels[i].totalPeriods
      }
    }
    
    if (totalPeriods === 0) {
      return { icon: '', text: '暂无分期', status: 'none' }
    }
    
    // 理论应该还的期数（按时间推算）
    var expectedPaid = monthsPassed
    
    // 比较实际还款与预期
    if (paidPeriods >= totalPeriods) {
      return { icon: '🎉', text: '已全部还清', status: 'completed' }
    } else if (paidPeriods >= expectedPaid) {
      return { icon: '🔥', text: '进度正常', status: 'normal' }
    } else if (paidPeriods >= expectedPaid - 2) {
      return { icon: '⚠️', text: '略微落后', status: 'behind' }
    } else {
      return { icon: '⏰', text: '严重落后', status: 'serious' }
    }
  },

  getTypeName: function(type) {
    var typeMap = {
      'credit_card': '信用卡',
      'bank_loan': '银行贷款',
      'company_loan': '企业贷款',
      'personal_loan': '个人贷款',
      'other': '其它'
    }
    return typeMap[type] || '其它'
  },

  getDaysUntil: function(repaymentDay) {
    var today = new Date()
    var repaymentDate = new Date(today.getFullYear(), today.getMonth(), repaymentDay)
    var diff = Math.ceil((repaymentDate - today) / (1000 * 60 * 60 * 24))
    return diff < 0 ? diff + 30 : diff
  },

  formatMoney: function(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
})
