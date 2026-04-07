const app = getApp()

Page({
  data: {
    calendarTitle: '',
    emptyDays: [],
    days: [],
    repaymentDays: []
  },

  onShow() {
    this.renderCalendar()
  },

  renderCalendar() {
    const now = new Date()
    const year = this.data.year || now.getFullYear()
    const month = this.data.month !== undefined ? this.data.month : now.getMonth()
    
    this.setData({ year, month })
    
    const title = `${year}年${month + 1}月`
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    const repaymentDays = app.globalData.channels.filter(c => c.remaining > 0).map(c => c.repaymentDay)

    const emptyDays = Array.from({length: firstDay}, (_, i) => i)
    const days = Array.from({length: daysInMonth}, (_, i) => {
      const day = i + 1
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
      const hasRepay = repaymentDays.includes(day)
      return { day, isToday, hasRepay }
    })

    this.setData({ calendarTitle: title, emptyDays, days })
  },

  prevMonth() {
    let { year, month } = this.data
    if (month === 0) { month = 11; year-- } else { month-- }
    this.setData({ year, month })
    this.renderCalendar()
  },

  nextMonth() {
    let { year, month } = this.data
    if (month === 11) { month = 0; year++ } else { month++ }
    this.setData({ year, month })
    this.renderCalendar()
  },

  onDayTap(e) {
    const day = e.currentTarget.dataset.day
    const channels = app.globalData.channels.filter(c => c.repaymentDay === day && c.remaining > 0)
    if (channels.length === 0) return
    const names = channels.map(c => c.name).join('、')
    wx.showModal({
      title: `${this.data.month + 1}月${day}日 还款任务`,
      content: names,
      showCancel: false
    })
  }
})