const app = getApp()

Page({
  data: {
    records: [],
    filteredRecords: [],
    filterType: 'all',
    totalRepaid: 0,
    monthRepaid: 0,
    clearedCount: 0
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const records = app.globalData.records || []
    const channels = app.globalData.channels || []
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const totalRepaid = records.reduce((s, r) => s + r.amount, 0)
    const monthRepaid = records.filter(r => new Date(r.time) >= startOfMonth).reduce((s, r) => s + r.amount, 0)
    const clearedCount = channels.filter(c => c.remaining === 0).length

    this.setData({ records, totalRepaid, monthRepaid, clearedCount })
    this.applyFilter()
  },

  applyFilter() {
    const { records, filterType } = this.data
    const now = new Date()
    let filtered = records
    if (filterType === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = records.filter(r => new Date(r.time) >= start)
    } else if (filterType === 'year') {
      const start = new Date(now.getFullYear(), 0, 1)
      filtered = records.filter(r => new Date(r.time) >= start)
    }
    this.setData({ filteredRecords: filtered })
  },

  setFilter(e) {
    this.setData({ filterType: e.currentTarget.dataset.type })
    this.applyFilter()
  },

  formatMoney(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  }
})