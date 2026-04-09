var app = getApp()

Page({
  data: {
    year: 0,
    month: 0,
    calendarTitle: '',
    emptyDays: [],
    days: [],
    repaymentDays: [],
    repayList: []
  },

  onShow: function() {
    var now = new Date()
    this.setData({ year: now.getFullYear(), month: now.getMonth() })
    this.renderCalendar()
  },

  renderCalendar: function() {
    var year = this.data.year
    var month = this.data.month
    
    var title = year + '年' + (month + 1) + '月'
    var firstDay = new Date(year, month, 1).getDay()
    var daysInMonth = new Date(year, month + 1, 0).getDate()
    var today = new Date()
    
    var channels = app.globalData.channels || []
    
    // 按还款日分组
    var dayChannels = {}
    for (var i = 0; i < channels.length; i++) {
      var ch = channels[i]
      var day = ch.repaymentDay
      if (!dayChannels[day]) dayChannels[day] = []
      dayChannels[day].push(ch)
    }

    var emptyDays = []
    for (var e = 0; e < firstDay; e++) {
      emptyDays.push(e)
    }
    
    var days = []
    var repayList = []
    var monthTotal = 0
    for (var d = 1; d <= daysInMonth; d++) {
      var isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
      var isRepayDay = dayChannels[d] && dayChannels[d].length > 0
      var dayChannelsList = dayChannels[d] || []
      
      days.push({ 
        day: d, 
        isToday: isToday, 
        isRepayDay: isRepayDay,
        channels: dayChannelsList
      })
      
      // 本月待还款列表
      if (isRepayDay) {
        var pendingList = dayChannelsList.filter(function(c) { return c.remaining > 0 })
        var totalAmount = 0
        for (var k = 0; k < pendingList.length; k++) {
          totalAmount += pendingList[k].monthlyPayment || 0
        }
        if (pendingList.length > 0) {
          monthTotal += totalAmount
          repayList.push({
            day: d,
            month: month + 1,
            channels: dayChannelsList,
            totalAmount: totalAmount
          })
        }
      }
    }

    this.setData({ 
      calendarTitle: title, 
      emptyDays: emptyDays, 
      days: days,
      repayList: repayList.sort(function(a, b) { return a.day - b.day }),
      monthTotal: monthTotal.toFixed(2)
    })
  },

  prevMonth: function() {
    var year = this.data.year
    var month = this.data.month
    if (month === 0) { month = 11; year-- } else { month-- }
    this.setData({ year: year, month: month })
    this.renderCalendar()
  },

  nextMonth: function() {
    var year = this.data.year
    var month = this.data.month
    if (month === 11) { month = 0; year++ } else { month++ }
    this.setData({ year: year, month: month })
    this.renderCalendar()
  },

  onDayTap: function(e) {
    var day = e.currentTarget.dataset.day
    var channels = app.globalData.channels || []
    var dayChannels = []
    for (var i = 0; i < channels.length; i++) {
      if (channels[i].repaymentDay === day) {
        dayChannels.push(channels[i])
      }
    }
    if (dayChannels.length === 0) return
    
    var content = ''
    for (var j = 0; j < dayChannels.length; j++) {
      var ch = dayChannels[j]
      content += ch.name + ' - ' + (ch.remaining > 0 ? '待还 ¥' + ch.remaining : '已还清') + '\n'
    }
    wx.showModal({
      title: (this.data.month + 1) + '月' + day + '日 还款',
      content: content,
      showCancel: false
    })
  },

  goToRepay: function(e) {
    var id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
    }
  }
})
