const app = getApp()

Page({
  data: {
    form: {
      name: '',
      type: 'credit_card',
      totalAmount: '',
      monthlyPayment: '',
      totalPeriods: '',
      repaymentDay: 10,
      interestRate: ''
    },
    isEdit: false,
    editId: null,
    dayOptions: Array.from({length: 28}, (_, i) => `${i + 1}日`),
    dayIndex: 9
  },

  onLoad(options) {
    if (options.id) {
      const id = parseInt(options.id)
      const ch = app.globalData.channels.find(c => c.id === id)
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
            repaymentDay: ch.repaymentDay,
            interestRate: ch.interestRate ? String(ch.interestRate) : ''
          },
          dayIndex: ch.repaymentDay - 1
        })
        wx.setNavigationBarTitle({ title: '编辑负债' })
      }
    }
  },

  onNameInput(e) { this.setData({ 'form.name': e.detail.value }) },
  onTotalInput(e) { this.setData({ 'form.totalAmount': e.detail.value }) },
  onMonthlyInput(e) { this.setData({ 'form.monthlyPayment': e.detail.value }) },
  onPeriodsInput(e) { this.setData({ 'form.totalPeriods': e.detail.value }) },
  onRateInput(e) { this.setData({ 'form.interestRate': e.detail.value }) },

  selectType(e) {
    this.setData({ 'form.type': e.currentTarget.dataset.type })
  },

  onDayChange(e) {
    const idx = parseInt(e.detail.value)
    this.setData({ 'form.repaymentDay': idx + 1, dayIndex: idx })
  },

  saveChannel() {
    const f = this.data.form
    const name = f.name.trim()
    const total = parseFloat(f.totalAmount) || 0
    if (!name || total <= 0) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    const data = {
      name,
      type: f.type,
      totalAmount: total,
      monthlyPayment: parseFloat(f.monthlyPayment) || total,
      totalPeriods: parseInt(f.totalPeriods) || 0,
      repaymentDay: f.repaymentDay,
      interestRate: parseFloat(f.interestRate) || 0
    }

    if (this.data.isEdit) {
      const ch = app.globalData.channels.find(c => c.id === this.data.editId)
      if (ch) {
        Object.assign(ch, data)
        ch.progress = Math.round(((ch.totalAmount - ch.remaining) / ch.totalAmount) * 100)
      }
      wx.showToast({ title: '修改成功', icon: 'success' })
    } else {
      data.id = Date.now()
      data.remaining = total
      data.progress = 0
      data.paidPeriods = 0
      app.globalData.channels.push(data)
      wx.showToast({ title: '添加成功', icon: 'success' })
    }

    app.saveData()
    setTimeout(() => wx.navigateBack(), 1000)
  }
})