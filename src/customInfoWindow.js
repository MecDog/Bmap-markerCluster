import Vue from 'vue'

function customInfoWindow (options, point) {
  let defaultOptions = {
    offsetX: 0,
    offsetY: 0,
    fetch: null
  }
  if (typeof options.el === 'function') {
    this.$instance = new options.el()
  } else {
    this.$instance = new Vue(options.el)
  }
  if (!point) {
    this._point = new window.BMap.Point(116.404, 39.915)
  }
  this.options = Object.assign(defaultOptions, options)
  this.$el = this.$instance.$mount().$el
}
customInfoWindow.prototype = new window.BMap.Overlay()

customInfoWindow.prototype.initialize = function (map) {
  let style = {
    position: 'absolute',
    display: 'none'
  }
  this._map = map
  Object.assign(this.$el.style, style)
  'mousedown,touchstart,touchmove,touchend,mouseover,click,dblclick,mousewheel'.split(',')
    .forEach(event => {
      this.$el.addEventListener(event, e => {
        e.stopPropagation()
      })
    })
  // 判断点击事件的对象是否是此infoWindow
  // 不是的话就隐藏infoWindow
  map.addEventListener('click', () => {
    if (Date.now() - this._timestamp > 80) {
      this.hide()
    }
  })
  map.getPanes().floatPane.appendChild(this.$el)
  return this.$el
}
customInfoWindow.prototype.draw = function () {
  let map = this._map
  let pixel = map.pointToOverlayPixel(this._point)
  let x = pixel.x + this.options.offsetX
  let y = pixel.y + this.options.offsetY
  this.$el.style.left = x + 'px'
  this.$el.style.top = y + 'px'
}
customInfoWindow.prototype.setPosition = function (point) {
  this._point = point
  this.draw()
  this.$instance.infoWIndowShow && this.$instance.infoWIndowShow()
  this.$el.style.useSelect = 'text'
  this.$el.style.cursor = 'auto'
}
customInfoWindow.prototype.show = function (arg) {
  if (typeof this.options.fetch === 'function' && arg !== false) {
    this.options.fetch(arg).then((res) => {
      this.$instance.ajaxData = res
      this.$el.style.display = 'block'
      this._timestamp = Date.now()
      this.$instance.infoWIndowShow && this.$instance.infoWIndowShow()
    })
  } else {
    this.$el.style.display = 'block'
    this._timestamp = Date.now()
    this.$instance.infoWIndowShow && this.$instance.infoWIndowShow()
  }
}
customInfoWindow.prototype.hide = function () {
  this.$el.style.display = 'none'
  this.$instance.hide && this.$instance.hide()
}
export default customInfoWindow
