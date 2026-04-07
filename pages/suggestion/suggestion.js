const app = getApp()

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

  onShow() {
    this.loadData()
  },

  loadData() {
    const channels = app.globalData.channels.filter(c => c.remaining > 0)
    const totalDebt = channels.reduce((s, c) => s + c.remaining, 0)
    const monthlyPayment = channels.reduce((s, c) => s + c.monthlyPayment, 0)
    const estimatedMonths = monthlyPayment > 0 ? Math.ceil(totalDebt / monthlyPayment) : 0
    const clearDate = estimatedMonths > 0 ? (() => {
      const d = new Date()
      d.setMonth(d.getMonth() + estimatedMonths)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })() : '-'

    const snowball = [...channels].sort((a, b) => a.remaining - b.remaining)
    const avalanche = [...channels].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0))

    this.setData({
      snowballChannels: snowball.slice(0, 3),
      avalancheChannels: avalanche.slice(0, 3),
      totalDebt,
      monthlyPayment,
      estimatedMonths,
      clearDate
    })
  },

  selectStrategy(e) {
    this.setData({ selectedStrategy: e.currentTarget.dataset.strategy })
  },

  formatMoney(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
})