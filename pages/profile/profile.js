const app = getApp()

Page({
  data: {
    totalDebt: 0,
    clearedCount: 0,
    totalRepaid: 0,
    useDays: 0
  },

  onShow() {
    const channels = app.globalData.channels || []
    const totalDebt = channels.reduce((s, c) => s + c.remaining, 0)
    const totalOrig = channels.reduce((s, c) => s + c.totalAmount, 0)
    const totalRepaid = totalOrig - totalDebt
    const clearedCount = channels.filter(c => c.remaining === 0).length
    const createdAt = app.globalData.createdAt || new Date().toISOString()
    const useDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1

    this.setData({ totalDebt, totalRepaid, clearedCount, useDays })
  },

  formatMoney(n) {
    return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  goSuggestion() {
    wx.navigateTo({ url: '/pages/suggestion/suggestion' })
  },

  goAchievement() {
    wx.navigateTo({ url: '/pages/achievement/achievement' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '负债管理 v2.0.0\n致力于帮助用户轻松管理债务，早日实现财务自由。',
      showCancel: false
    })
  },

  exportData() {
    const data = JSON.stringify({
      channels: app.globalData.channels,
      records: app.globalData.records,
      settings: app.globalData.settings,
      achievements: app.globalData.achievements,
      exportTime: new Date().toISOString()
    }, null, 2)

    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
      }
    })
  },

  importData() {
    wx.showModal({
      title: '导入数据',
      content: '请粘贴JSON数据到剪贴板后点击确定',
      success: (res) => {
        if (res.confirm) {
          wx.getClipboardData({
            success: (clip) => {
              try {
                const data = JSON.parse(clip.data)
                if (data.channels) {
                  app.globalData.channels = data.channels
                  app.globalData.records = data.records || []
                  if (data.settings) app.globalData.settings = { ...app.globalData.settings, ...data.settings }
                  if (data.achievements) app.globalData.achievements = data.achievements
                  app.saveData()
                  wx.showToast({ title: '导入成功', icon: 'success' })
                }
              } catch(e) {
                wx.showToast({ title: '数据格式错误', icon: 'none' })
              }
            }
          })
        }
      }
    })
  }
})