var app = getApp()

Page({
  data: {
    selectedStrategy: 'snowball',
    snowballChannels: [],
    avalancheChannels: [],
    currentChannels: [],
    totalDebt: 0,
    monthlyPayment: 0,
    estimatedMonths: 0,
    clearDate: '-'
  },

  onShow: function() {
    this.loadData()
  },

  loadData: function() {
    var that = this
    var channels = []
    var allChannels = app.globalData.channels || []
    
    for (var i = 0; i < allChannels.length; i++) {
      if (allChannels[i].remaining > 0) {
        channels.push(allChannels[i])
      }
    }
    
    var totalDebt = 0
    var monthlyPayment = 0
    for (var j = 0; j < channels.length; j++) {
      totalDebt += channels[j].remaining || 0
      monthlyPayment += channels[j].monthlyPayment || 0
    }
    
    console.log('channels:', channels)
    console.log('totalDebt:', totalDebt, 'monthlyPayment:', monthlyPayment)
    
    var estimatedMonths = monthlyPayment > 0 ? Math.ceil(totalDebt / monthlyPayment) : 0
    var clearDate = '-'
    if (estimatedMonths > 0) {
      var d = new Date()
      d.setMonth(d.getMonth() + estimatedMonths)
      clearDate = d.getFullYear() + '-' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1)
    }

    // 按剩余金额升序（雪球法）
    var snowball = channels.slice().sort(function(a, b) { return (a.remaining || 0) - (b.remaining || 0) })
    // 按利率降序（雪崩法）
    var avalanche = channels.slice().sort(function(a, b) { return (b.interestRate || 0) - (a.interestRate || 0) })

    // 预处理格式化金额
    for (var k = 0; k < snowball.length; k++) {
      snowball[k].remainingDisplay = this.formatMoney(snowball[k].remaining || 0)
      snowball[k].monthlyDisplay = this.formatMoney(snowball[k].monthlyPayment || 0)
    }
    for (var m = 0; m < avalanche.length; m++) {
      avalanche[m].remainingDisplay = this.formatMoney(avalanche[m].remaining || 0)
      avalanche[m].monthlyDisplay = this.formatMoney(avalanche[m].monthlyPayment || 0)
    }

    that.setData({
      snowballChannels: snowball,
      avalancheChannels: avalanche,
      currentChannels: snowball,
      totalDebt: totalDebt,
      totalDebtDisplay: this.formatMoney(totalDebt),
      monthlyPayment: monthlyPayment,
      monthlyPaymentDisplay: this.formatMoney(monthlyPayment),
      estimatedMonths: estimatedMonths,
      clearDate: clearDate
    })
  },

  selectStrategy: function(e) {
    var strategy = e.currentTarget.dataset.strategy
    var channels = strategy === 'snowball' ? this.data.snowballChannels : this.data.avalancheChannels
    this.setData({ 
      selectedStrategy: strategy,
      currentChannels: channels
    })
  },

  formatMoney: function(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
})
