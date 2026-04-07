var app = getApp()

Page({
  data: {
    achievements: []
  },

  onShow: function() {
    this.loadAchievements()
  },

  loadAchievements: function() {
    var channels = app.globalData.channels
    var records = app.globalData.records
    var unlocked = app.globalData.achievements || []

    var totalOrig = 0
    var remaining = 0
    for (var i = 0; i < channels.length; i++) {
      totalOrig += channels[i].totalAmount
      remaining += channels[i].remaining
    }
    var progress = totalOrig > 0 ? (totalOrig - remaining) / totalOrig : 0
    
    var newOnes = []
    var checkUnlocked = function(id) {
      for (var j = 0; j < unlocked.length; j++) {
        if (unlocked[j] === id) return true
      }
      return false
    }
    
    if (records.length > 0 && !checkUnlocked('first_repay')) newOnes.push('first_repay')
    
    var hasCleared = false
    for (var k = 0; k < channels.length; k++) {
      if (channels[k].remaining === 0) { hasCleared = true; break }
    }
    if (hasCleared && !checkUnlocked('first_clear')) newOnes.push('first_clear')
    
    if (progress >= 0.5 && !checkUnlocked('half_paid')) newOnes.push('half_paid')
    if (remaining === 0 && channels.length > 0 && !checkUnlocked('all_clear')) newOnes.push('all_clear')
    
    if (newOnes.length > 0) {
      app.globalData.achievements = unlocked.concat(newOnes)
      app.saveData()
    }

    var list = [
      { id: 'first_repay', name: '首次还款', desc: '完成第一次还款', icon: '🎯' },
      { id: 'first_clear', name: '还清第一个渠道', desc: '完全还清一个负债渠道', icon: '🏆' },
      { id: 'half_paid', name: '负债减半', desc: '总负债减少50%', icon: '💪' },
      { id: 'streak_3', name: '连续还款达人', desc: '连续3个月按时还款', icon: '🔥' },
      { id: 'all_clear', name: '财务自由', desc: '还清所有负债', icon: '🎉' }
    ]

    var achievements = []
    for (var m = 0; m < list.length; m++) {
      var item = list[m]
      var isUnlocked = false
      for (var n = 0; n < app.globalData.achievements.length; n++) {
        if (app.globalData.achievements[n] === item.id) {
          isUnlocked = true
          break
        }
      }
      achievements.push({ id: item.id, name: item.name, desc: item.desc, icon: item.icon, unlocked: isUnlocked })
    }

    this.setData({ achievements: achievements })
  }
})
