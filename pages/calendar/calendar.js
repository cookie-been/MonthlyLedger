var app = getApp()

Page({
  data: {
    year: 0,
    month: 0,
    calendarTitle: '',
    emptyDays: [],
    days: [],
    repaymentDays: []
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
    
    var channels = app.globalData.channels
    var repaymentDays = []
    for (var i = 0; i < channels.length; i++) {
      if (channels[i].remaining > 0) {
        repaymentDays.push(channels[i].repaymentDay)
      }
    }

    var emptyDays = []
    for (var e = 0; e < firstDay; e++) {
      emptyDays.push(e)
    }
    
    var days = []
    for (var d = 1; d <= daysInMonth; d++) {
      var isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
      var hasRepay = false
      for (var j = 0; j < repaymentDays.length; j++) {
        if (repaymentDays[j] === d) {
          hasRepay = true
          break
        }
      }
      days.push({ day: d, isToday: isToday, hasRepay: hasRepay })
    }

    this.setData({ calendarTitle: title, emptyDays: emptyDays, days: days })
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
    var channels = app.globalData.channels
    var names = []
    for (var i = 0; i < channels.length; i++) {
      if (channels[i].repaymentDay === day && channels[i].remaining > 0) {
        names.push(channels[i].name)
      }
    }
    if (names.length === 0) return
    wx.showModal({
      title: (this.data.month + 1) + '月' + day + '日 还款任务',
      content: names.join('、'),
      showCancel: false
    })
  }
})
