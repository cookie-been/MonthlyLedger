function formatTime(date) {
  var y = date.getFullYear()
  var m = date.getMonth() + 1
  var d = date.getDate()
  var h = date.getHours()
  var min = date.getMinutes()
  var s = date.getSeconds()
  return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d + ' ' + 
         (h < 10 ? '0' : '') + h + ':' + (min < 10 ? '0' : '') + min + ':' + (s < 10 ? '0' : '') + s
}

function parseDate(str) {
  if (!str) return new Date()
  // iOS requires YYYY/MM/DD format
  return new Date(str.replace(/-/g, '/'))
}

module.exports = {
  formatTime: formatTime,
  parseDate: parseDate
}
