import CustomMarker from './customMarker'
import CustomInfoWindow from './customInfoWindow.js'
function loadWebAssembly(filename, imports) {
  // Fetch the file and compile it
  return fetch(filename)
    .then(response => response.arrayBuffer())
    .then(buffer => WebAssembly.compile(buffer))
    .then(module => {
      // Create the imports for the module, including the
      // standard dynamic library imports
      imports = imports || {};
      imports.env = imports.env || {}
      imports.env.memoryBase = imports.env.memoryBase || 0;
      imports.env.tableBase = imports.env.tableBase || 0;
      imports.env.abort = imports.env.abort || function () {console.log('webassembly abort')};
      if (!imports.env.memory) {
        imports.env.memory = new WebAssembly.Memory({ initial: 256 });
      }
      if (!imports.env.table) {
        imports.env.table = new WebAssembly.Table({ initial: 4, element: 'anyfunc' });
      }
      // Create the instance.
      return new WebAssembly.Instance(module, imports);
    });
}

class MarkerCluster {
  markers = []
  clusters = []
  // 默认聚合参数
  defaultClusterOptions = {
    gridSize: 60,
    maxZoom: 18,
    minClusterSize: 2,
    isAverageCenter: false
  }
  constructor (map, data = [], options) {
    this.map = map
    this.options = options
    this.data = this.transferToMercator(data) // 将经纬度坐标转换为墨托卡坐标
    this.initOptions(options)

    this.map.addEventListener('zoomend', () => {
      console.time('全过程')
      this._redraw()
      console.timeEnd('全过程')
    })
    this.map.addEventListener('moveend', () => {
      this._redraw()
    })
    if (this.options.cluster) {
      this._createClusters()
    } else {
      this.draw()
    }
  }
  initOptions (options) {
    if (options.cluster) {
      options.cluster = Object.assign({}, this.defaultClusterOptions, options.cluster)
      let clusterOpts = options.cluster
      // 初始化infoWindow
      if (clusterOpts.infoWindow) {
        this.cluterInfoWindow = this.createInfoWindow(clusterOpts, true)
        this.map.addOverlay(this.cluterInfoWindow)
      }
    } else {
      options.cluster = null
    }

    if (options.infoWindow) {
      this.infoWindow = this.createInfoWindow(options)
      this.map.addOverlay(this.infoWindow)
    }
  }
  createInfoWindow (opts, isCluster) {
    let infoWindow = new CustomInfoWindow(opts.infoWindow)
    // 默认会自动marker点击事件自动打开infoWindow
    if (opts.infoWindow.autoOpen !== false) {
      let methods = opts.marker.methods || {}
      let cb = methods.click
      methods.click = (data, marker) => {
        cb && cb(data, marker)
        if (isCluster) {
          infoWindow.$instance.markers = data
          infoWindow.setPosition(data[0].location)
          infoWindow.show(data)
        } else {
          infoWindow.$instance.markers = [data]
          infoWindow.setPosition(data.location)
          infoWindow.show(data)
        }
      }
      opts.marker.methods = methods
    }
    return infoWindow
  }
  // 将经纬度坐标转换为墨托卡坐标,data为数组或一个数据对象
  transferToMercator (data) {
    var projection = this.map.getMapType().getProjection()
    if (data instanceof Array) {
      data.forEach((item) => {
        let pixel = projection.lngLatToPoint(item.location)
        item.coordinates_mercator = [Math.round(pixel.x), Math.round(pixel.y)]
      })
    } else {
      let pixel = projection.lngLatToPoint(data.location)
      data.coordinates_mercator = [Math.round(pixel.x), Math.round(pixel.y)]
    }
    return data
  }
  _createClusters () {
    console.time('计算耗时')
    let map = this.map
    let clusterOptions = this.options.cluster
    let zoomUnit = Math.pow(2, 18 - map.getZoom())
    let projection = map.getMapType().getProjection()
    let mcCenter = projection.lngLatToPoint(map.getCenter())
    let mapSize = map.getSize()
    let nwMc = new window.BMap.Pixel(mcCenter.x - mapSize.width / 2 * zoomUnit, mcCenter.y + mapSize.height / 2 * zoomUnit) // 左上角墨卡托
    let seMc = new window.BMap.Pixel(mcCenter.x + mapSize.width / 2 * zoomUnit, mcCenter.y - mapSize.height / 2 * zoomUnit) // 右下角墨卡托
    clusterOptions.gridSize_mercator = Math.round(clusterOptions.gridSize * zoomUnit) // gridSize转换到墨卡托坐标上的大小
  
    if (!this.WebAssembly) {
      let memory = this._memory = new WebAssembly.Memory({ initial: 500 })
      let importObj = {
        env: {
          memory,
          __Z10consoleLogx: (n) => {
            console.log('c++:'+ n)
          },
          table: new WebAssembly.Table({ initial: 16, element: 'anyfunc' }),
        }
      }
      this.WebAssembly = loadWebAssembly('webAssembly/createCluster.wasm', importObj).then((instance) => {
        let exports = instance.exports
        let offset = exports._getData()
        let dataMemory = new Uint32Array(this._memory.buffer, offset)
        this.data.forEach((item, index) => {
          dataMemory[2 * index] = item.coordinates_mercator[0]
          dataMemory[2 * index + 1] = item.coordinates_mercator[1]
        })
        return instance.exports
      })
    }
    this.WebAssembly.then(exports => {
      // 返回聚合点个数
      exports._setBoundary(Math.round(nwMc.x), Math.round(nwMc.y),Math.round(seMc.x), Math.round(seMc.y))
      let num = exports._createCluster(this.data.length, clusterOptions.gridSize_mercator)
      let tagOffset = exports._getClusterTag()
      let tagMemory = new Uint32Array(this._memory.buffer, tagOffset)
      let clusters = []
      for (let i = 0, l = this.data.length; i < l; i ++) {
        let tag = tagMemory[i]
        if(clusters[tag] && tag) {
          clusters[tag].addMarker(this.data[i])
        } else {
          clusters[tag] = new Cluster(this, this.data[i])
        }
      }
      this.clusters = clusters
      console.timeEnd('计算耗时')
      this.draw()
    })
  }
  // 判断点位置是否在屏幕范围内,参数都为墨卡托坐标
  _isPointInScreen (point, bounds, gridSize) {
    return point[0] >= bounds[0].x - gridSize &&
      point[0] <= bounds[1].x + gridSize &&
      point[1] <= bounds[0].y + gridSize &&
      point[1] >= bounds[1].y - gridSize
  }
  draw () {
    let markers = []
    let options = this.options
    let clusterOptions = this.options.cluster
    if (!clusterOptions || this.map.getZoom() > clusterOptions.maxZoom) {
      this.data.forEach(item => {
        let marker = this._createMarker(item, options)
        markers.push(marker)
      })
    } else {
      this.clusters.forEach((cluster) => {
        if (cluster.markers.length >= clusterOptions.minClusterSize) {
          let clusterMarker = this._createMarker(cluster, clusterOptions)
          markers.push(clusterMarker)
        } else {
          cluster.markers.forEach(data => {
            let marker = this._createMarker(data, options)
            markers.push(marker)
          })
        }
      })
    }
    markers.forEach((marker) => {
      this.map.addOverlay(marker)
    })
    this.markers = markers
  }
  _createMarker (data, options) {
    let baiduPoint
    let marker
    if (data instanceof Cluster) {
      let center = data.getCenter()
      baiduPoint = new window.BMap.Point(center.location.lng, center.location.lat)
      marker = new CustomMarker(baiduPoint, options.marker, data.markers)
    } else {
      baiduPoint = new window.BMap.Point(data.location.lng, data.location.lat)
      marker = new CustomMarker(baiduPoint, options.marker, data)
    }
    return marker
  }
  _redraw () {
    let clusterOpts = this.options.cluster
    if (clusterOpts && this.map.getZoom() <= clusterOpts.maxZoom) {
      this.clusters = []
      this.clearMarkers()
      this._createClusters()
    }
    console.time('dom绘制')
    this.draw()
    console.timeEnd('dom绘制')
  }
  setMarkers (data) {
    this.data = this.transferToMercator(data)
    this._redraw()
  }
  addMarker (data) {
    data = this.transferToMercator(data)
    this.data = this.data.concat(data)
    this._redraw()
  }
  addMarkers (data) {
    data = this.transferToMercator(data)
    this.data.concat(data)
  }
  clearMarkers () {
    this.markers.forEach(marker => {
      this.map.removeOverlay(marker)
    })
    this.markers = []
  }
}
class Cluster {
  markers = []
  constructor (MarkerCluster, data) {
    this.MarkerCluster = MarkerCluster
    this.clusterOptions = MarkerCluster.options.cluster
    this.center = data
    this.markers.push(data)
  }
  getCenter () {
    return this.center
  }
  getMarkers () {
    return this.markers
  }
  // 点是否在聚合范围内，point为墨卡托坐标
  isPointInCluster (coordinates) {
    let gridSize = this.clusterOptions.gridSize_mercator
    let center = this.center.coordinates_mercator
    return coordinates[0] >= center[0] - gridSize &&
      coordinates[0] <= center[0] + gridSize &&
      coordinates[1] <= center[1] + gridSize &&
      coordinates[1] >= center[1] - gridSize
  }
  addMarker (marker) {
    this.markers.push(marker)
  }
}

export default MarkerCluster
