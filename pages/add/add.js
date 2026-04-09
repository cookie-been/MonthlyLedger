var app = getApp()

Page({
  data: {
    form: {
      name: '',
      type: 'credit_card',
      totalAmount: '',
      monthlyPayment: '',
      totalPeriods: '',
      paidPeriods: '',
      repaymentDay: 10,
      interestRate: ''
    },
    isEdit: false,
    editId: null,
    canSave: false,
    dayOptions: ['1日', '2日', '3日', '4日', '5日', '6日', '7日', '8日', '9日', '10日', '11日', '12日', '13日', '14日', '15日', '16日', '17日', '18日', '19日', '20日', '21日', '22日', '23日', '24日', '25日', '26日', '27日', '28日', '29日', '30日', '31日'],
    dayIndex: 9
  },

  onLoad: function(options) {
    if (options.id) {
      var id = parseInt(options.id)
      var channels = app.globalData.channels
      var ch = null
      for (var i = 0; i < channels.length; i++) {
        if (channels[i].id === id) {
          ch = channels[i]
          break
        }
      }
      if (ch) {
        this.setData({
          isEdit: true,
          editId: id,
          form: {
            name: ch.name,
            type: ch.type,
            totalAmount: String(ch.totalAmount),
            monthlyPayment: String(ch.monthlyPayment),
            totalPeriods: ch.totalPeriods ? String(ch.totalPeriods) : '',
            paidPeriods: ch.paidPeriods ? String(ch.paidPeriods) : '',
            repaymentDay: ch.repaymentDay,
            interestRate: ch.interestRate ? String(ch.interestRate) : ''
          },
          dayIndex: ch.repaymentDay - 1,
          canSave: true
        })
        wx.setNavigationBarTitle({ title: '编辑账单' })
      }
    }
  },

  checkCanSave: function() {
    var f = this.data.form
    var name = f.name.replace(/^\s+|\s+$/g, '')
    var total = parseFloat(f.totalAmount) || 0
    var canSave = name.length > 0 && total > 0
    this.setData({ canSave: canSave })
  },

  onNameInput: function(e) {
    this.setData({ 'form.name': e.detail.value })
    this.checkCanSave()
  },

  onTotalInput: function(e) {
    this.setData({ 'form.totalAmount': e.detail.value })
    this.checkCanSave()
  },

  onMonthlyInput: function(e) {
    this.setData({ 'form.monthlyPayment': e.detail.value })
  },

  onPeriodsInput: function(e) {
    this.setData({ 'form.totalPeriods': e.detail.value })
  },

  onPaidPeriodsInput: function(e) {
    this.setData({ 'form.paidPeriods': e.detail.value })
  },

  onRateInput: function(e) {
    this.setData({ 'form.interestRate': e.detail.value })
  },

  selectType: function(e) {
    this.setData({ 'form.type': e.currentTarget.dataset.type })
  },

  onDayChange: function(e) {
    var idx = parseInt(e.detail.value)
    this.setData({ 'form.repaymentDay': idx + 1, dayIndex: idx })
  },

  saveChannel: function() {
    var f = this.data.form
    var name = f.name.replace(/^\s+|\s+$/g, '')
    var total = parseFloat(f.totalAmount) || 0
    
    if (!name || total <= 0) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    var data = {
      name: name,
      type: f.type,
      totalAmount: total,
      monthlyPayment: parseFloat(f.monthlyPayment) || total,
      totalPeriods: parseInt(f.totalPeriods) || 0,
      paidPeriods: parseInt(f.paidPeriods) || 0,
      repaymentDay: f.repaymentDay,
      interestRate: parseFloat(f.interestRate) || 0
    }

    if (this.data.isEdit) {
      var channels = app.globalData.channels
      for (var i = 0; i < channels.length; i++) {
        if (channels[i].id === this.data.editId) {
          channels[i].name = data.name
          channels[i].type = data.type
          channels[i].totalAmount = data.totalAmount
          channels[i].monthlyPayment = data.monthlyPayment
          channels[i].totalPeriods = data.totalPeriods
          channels[i].paidPeriods = data.paidPeriods
          channels[i].repaymentDay = data.repaymentDay
          channels[i].interestRate = data.interestRate
          channels[i].progress = Math.round(((channels[i].totalAmount - channels[i].remaining) / channels[i].totalAmount) * 100)
          break
        }
      }
      wx.showToast({ title: '修改成功', icon: 'success' })
    } else {
      data.id = new Date().getTime()
      data.remaining = total
      data.progress = 0
      data.paidPeriods = data.paidPeriods
      app.globalData.channels.push(data)
      wx.showToast({ title: '添加成功', icon: 'success' })
    }

    app.saveData()
    setTimeout(function() {
      wx.navigateBack()
    }, 1000)
  }
})
