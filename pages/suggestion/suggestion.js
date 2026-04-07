var app = getApp()

Page({
  data: {
    selectedStrategy: 'snowball',
    snowballChannels: [],
    avalancheChannels: [],
    totalDebt: 0,
    monthlyPayment: 0,
    estimatedMonths: 0,
    clearDate: '-'
  },

  onShow: function() {
    this.loadData()
  },

  loadData: function() {
    var channels = []
    for (var i = 0; i < app.globalData.channels.length; i++) {
      if (app.globalData.channels[i].remaining > 0) {
        channels.push(app.globalData.channels[i])
      }
    }
    
    var totalDebt = 0
    var monthlyPayment = 0
    for (var j = 0; j < channels.length; j++) {
      totalDebt += channels[j].remaining
      monthlyPayment += channels[j].monthlyPayment
    }
    
    var estimatedMonths = monthlyPayment > 0 ? Math.ceil(totalDebt / monthlyPayment) : 0
    var clearDate = '-'
    if (estimatedMonths > 0) {
      var d = new Date()
      d.setMonth(d.getMonth() + estimatedMonths)
      clearDate = d.getFullYear() + '-' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1)
    }

    var snowball = channels.slice().sort(function(a, b) { return a.remaining - b.remaining })
    var avalanche = channels.slice().sort(function(a, b) { return (b.interestRate || 0) - (a.interestRate || 0) })

    this.setData({
      snowballChannels: snowball.slice(0, 3),
      avalancheChannels: avalanche.slice(0, 3),
      totalDebt: totalDebt,
      monthlyPayment: monthlyPayment,
      estimatedMonths: estimatedMonths,
      clearDate: clearDate
    })
  },

  selectStrategy: function(e) {
    this.setData({ selectedStrategy: e.currentTarget.dataset.strategy })
  },

  formatMoney: function(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
})
