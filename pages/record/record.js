var app = getApp()
var util = require('../../utils/util.js')

Page({
  data: {
    records: [],
    filteredRecords: [],
    filterType: 'all',
    totalRepaid: 0,
    totalRepaidDisplay: '0.00',
    monthRepaid: 0,
    monthRepaidDisplay: '0.00',
    clearedCount: 0
  },

  onShow: function() {
    this.loadData()
  },

  loadData: function() {
    var records = app.globalData.records || []
    var channels = app.globalData.channels || []
    var now = new Date()
    var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    var startOfYear = new Date(now.getFullYear(), 0, 1)

    var totalRepaid = 0
    var monthRepaid = 0
    var clearedCount = 0

    for (var i = 0; i < records.length; i++) {
      totalRepaid += records[i].amount
      var recordDate = util.parseDate(records[i].time)
      if (recordDate.getTime() >= startOfMonth.getTime()) {
        monthRepaid += records[i].amount
      }
    }

    for (var j = 0; j < channels.length; j++) {
      if (channels[j].remaining === 0) {
        clearedCount++
      }
    }

    this.setData({ 
      records: records, 
      totalRepaid: totalRepaid, 
      totalRepaidDisplay: this.formatMoney(totalRepaid),
      monthRepaid: monthRepaid, 
      monthRepaidDisplay: this.formatMoney(monthRepaid),
      clearedCount: clearedCount 
    })
    this.applyFilter()
  },

  applyFilter: function() {
    var records = this.data.records
    var filterType = this.data.filterType
    var now = new Date()
    var that = this
    var filtered = records

    if (filterType === 'month') {
      var start = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = []
      for (var i = 0; i < records.length; i++) {
        if (util.parseDate(records[i].time).getTime() >= start.getTime()) {
          var rec = records[i]
          rec.amountDisplay = that.formatMoney(rec.amount)
          filtered.push(rec)
        }
      }
    } else if (filterType === 'year') {
      var startYear = new Date(now.getFullYear(), 0, 1)
      filtered = []
      for (var j = 0; j < records.length; j++) {
        if (util.parseDate(records[j].time).getTime() >= startYear.getTime()) {
          var rec = records[j]
          rec.amountDisplay = that.formatMoney(rec.amount)
          filtered.push(rec)
        }
      }
    } else {
      // all - 添加 display 字段
      for (var k = 0; k < records.length; k++) {
        records[k].amountDisplay = that.formatMoney(records[k].amount)
      }
    }

    this.setData({ filteredRecords: filtered })
  },

  setFilter: function(e) {
    this.setData({ filterType: e.currentTarget.dataset.type })
    this.applyFilter()
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

  goDetail: function(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id })
  }
})
