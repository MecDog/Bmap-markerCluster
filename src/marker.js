
// 将obj2中的属性对obj1赋值，与Object.assign不同的是，obj2属性若为undefined, 则不会覆盖obj1
function extend (obj1, obj2) {
  let keys = Object.keys(obj2)
  keys.forEach((key) => {
    if (obj2[key]) {
      obj1[key] = obj2[key]
    }
  })
  return obj1
}
class Marker extends window.BMap.Overlay {
  defaultOptions = {
    offsetX: 0,
    offsetY: 0
  }
  constructor (point, data, markerOptions = {}) {
    super()
    this.isCluster = Array.isArray(data) && data.length > 0
    let defaultOptions = {
      offsetX: 0,
      offsetY: 0
    }
    let options = extend(defaultOptions, markerOptions)
    if (!this.isCluster) {
      extend(options, {
        icon: data.icon,
        deg: data.deg,
        offsetX: data.offsetX,
        offsetY: data.offsetY,
      })
    }
    this.options = options
    this.data = data
    this.point = point
  }
  initialize (map) {
    let opts = this.options
    if (typeof opts.createElement === 'function') {
      this.$el = opts.createElement(this.data)
    } else {
      this.$el = this.createElement()
    }
    this.$el.addEventListener('mousedown', (e) => {
      e.stopPropagation()
    })
    this.$el.addEventListener('dragstart', (e) => {
      e.preventDefault();
    })
    if (opts.methods) {
      opts.methods.click && this.$el.addEventListener('click', () => {
        opts.methods.click(this.data, this)
      })
      opts.methods.mouseover && this.$el.addEventListener('mouseover', () => {
        opts.methods.mouseover(this.data, this.$el)
      })
    }
    this.map = map
    map.getPanes().labelPane.appendChild(this.$el)
    return this.$el
  }
  // 注意不要添加transfrom属性，不然性能骤降
  createElement () {
    let opts = this.options
    let div = document.createElement('div')
    let style = {
      position: 'absolute',
      cursor: 'pointer',
      transform: opts.deg ? `rotate(${opts.deg}deg)` : 'none'
    }
    Object.assign(div.style, style)
    let img = new Image()
    img.src = opts.icon
    extend(img.style, {
      width: opts.width + 'px',
      height: opts.height + 'px'
    })
    div.appendChild(img)
    if (opts.textStyle && this.isCluster) {
      let span = document.createElement('span')
      span.innerText = this.data.length
      if (opts.textStyle.transform) console.warn('[markerCluster]：transfrom样式会严重影响地图拖动性能，谨慎使用')
      extend(span.style, {
        position: 'absolute',
        left: '0',
        top: '0'
      })
      extend(span.style, opts.textStyle)
      div.appendChild(span)
    }
    return div
  }
  draw () {
    let map = this.map
    let pixel = map.pointToOverlayPixel(this.point)
    let x = pixel.x + this.options.offsetX
    let y = pixel.y + this.options.offsetY
    this.$el.style.left = x + 'px'
    this.$el.style.top = y + 'px'
  }
  setPosition (point) {
    this.point = point
    this.draw()
  }
}

export default Marker
