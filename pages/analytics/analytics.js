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
    warningChannels: []
  },

  onShow: function() {
    this.loadAnalytics()
  },

  loadAnalytics: function() {
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

    for (var i = 0; i < channels.length; i++) {
      var ch = channels[i]
      totalOriginal += ch.totalAmount
      totalDebt += ch.remaining
      totalPaid += (ch.totalAmount - ch.remaining)
      monthlyPayment += ch.monthlyPayment

      if (ch.interestRate > 0) {
        totalInterest += ch.interestRate
        interestCount++
      }

      if (ch.remaining > 0) {
        var typeName = this.getTypeName(ch.type)
        typeMap[typeName] = (typeMap[typeName] || 0) + ch.remaining
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

    var typeDistribution = []
    var typeNames = Object.keys(typeMap)
    for (var j = 0; j < typeNames.length; j++) {
      typeDistribution.push({
        name: typeNames[j],
        amount: typeMap[typeNames[j]],
        percent: totalDebt > 0 ? Math.round((typeMap[typeNames[j]] / totalDebt) * 100) : 0
      })
    }
    typeDistribution.sort(function(a, b) { return b.amount - a.amount })

    var sortedChannels = channels.filter(function(c) { return c.remaining > 0 })
      .sort(function(a, b) { return b.remaining - a.remaining })
    var topDebtChannel = sortedChannels.length > 0 ? sortedChannels[0] : null

    var recentRecords = records.slice(0, 5).map(function(r) {
      return {
        name: r.name,
        amount: r.amount,
        time: r.time,
        note: r.note
      }
    })

    this.setData({
      totalDebt: totalDebt,
      totalOriginal: totalOriginal,
      totalPaid: totalPaid,
      progressPercent: progressPercent,
      monthlyPayment: monthlyPayment,
      avgInterestRate: avgInterestRate,
      clearMonths: clearMonths,
      clearDate: clearDate,
      typeDistribution: typeDistribution,
      topDebtChannel: topDebtChannel,
      warningChannels: warningChannels,
      recentRecords: recentRecords
    })
  },

  getTypeName: function(type) {
    var typeMap = {
      'credit_card': '信用卡',
      'huabei': '银行',
      'net_loan': '网贷',
      'other': '其他'
    }
    return typeMap[type] || '其他'
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
