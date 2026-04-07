var app = getApp()

Page({
  data: {
    records: [],
    filteredRecords: [],
    filterType: 'all',
    totalRepaid: 0,
    monthRepaid: 0,
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
      if (new Date(records[i].time) >= startOfMonth) {
        monthRepaid += records[i].amount
      }
    }

    for (var j = 0; j < channels.length; j++) {
      if (channels[j].remaining === 0) {
        clearedCount++
      }
    }

    this.setData({ records: records, totalRepaid: totalRepaid, monthRepaid: monthRepaid, clearedCount: clearedCount })
    this.applyFilter()
  },

  applyFilter: function() {
    var records = this.data.records
    var filterType = this.data.filterType
    var now = new Date()
    var filtered = records

    if (filterType === 'month') {
      var start = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = []
      for (var i = 0; i < records.length; i++) {
        if (new Date(records[i].time) >= start) {
          filtered.push(records[i])
        }
      }
    } else if (filterType === 'year') {
      var startYear = new Date(now.getFullYear(), 0, 1)
      filtered = []
      for (var j = 0; j < records.length; j++) {
        if (new Date(records[j].time) >= startYear) {
          filtered.push(records[j])
        }
      }
    }

    this.setData({ filteredRecords: filtered })
  },

  setFilter: function(e) {
    this.setData({ filterType: e.currentTarget.dataset.type })
    this.applyFilter()
  },

  formatMoney: function(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  goDetail: function(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id })
  }
})
