const app = getApp()

Page({
  data: {
    achievements: []
  },

  onShow() {
    this.loadAchievements()
  },

  loadAchievements() {
    const channels = app.globalData.channels
    const records = app.globalData.records
    const unlocked = app.globalData.achievements || []

    const totalOrig = channels.reduce((s, c) => s + c.totalAmount, 0)
    const remaining = channels.reduce((s, c) => s + c.remaining, 0)
    const progress = totalOrig > 0 ? (totalOrig - remaining) / totalOrig : 0
    
    const newOnes = []
    if (records.length > 0 && !unlocked.includes('first_repay')) newOnes.push('first_repay')
    if (channels.some(c => c.remaining === 0) && !unlocked.includes('first_clear')) newOnes.push('first_clear')
    if (progress >= 0.5 && !unlocked.includes('half_paid')) newOnes.push('half_paid')
    if (remaining === 0 && channels.length > 0 && !unlocked.includes('all_clear')) newOnes.push('all_clear')
    
    if (newOnes.length > 0) {
      app.globalData.achievements = [...unlocked, ...newOnes]
      app.saveData()
    }

    const list = [
      { id: 'first_repay', name: '首次还款', desc: '完成第一次还款', icon: '🎯' },
      { id: 'first_clear', name: '还清第一个渠道', desc: '完全还清一个负债渠道', icon: '🏆' },
      { id: 'half_paid', name: '负债减半', desc: '总负债减少50%', icon: '💪' },
      { id: 'streak_3', name: '连续还款达人', desc: '连续3个月按时还款', icon: '🔥' },
      { id: 'all_clear', name: '财务自由', desc: '还清所有负债', icon: '🎉' }
    ]

    this.setData({
      achievements: list.map(item => ({
        ...item,
        unlocked: app.globalData.achievements.includes(item.id)
      }))
    })
  }
})