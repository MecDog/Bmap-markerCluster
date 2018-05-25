import wasmCluster from './markerCluster_wasm'
import jsCluster from './markerCluster'
import Vue from 'vue'

let map = new BMap.Map("map", {enableMapClick: false})
map.centerAndZoom(new BMap.Point(105.3964,35.9093), 7)
map.enableScrollWheelZoom()
map.disableDoubleClickZoom()


let MAX = 5

let pts = []
for (var j = 0; j< MAX; j++) {
  pts.push({
      location:{
        lng: Math.random() * 5 + 95,
        lat: Math.random() * 5 + 35,
      },
      gid: j,
      name: '第'+ j

    })
}
let icon = require('./assets/map_gather.png')
let clusterIcon = require('./assets/Apple.png')
let infoWindow = {
  template: 
  `
    <div style="background-color:white">
      <div v-show ="ajaxData.address" style="white-space: nowrap;"> 地点：{{ajaxData.address}}</div>
      <div  v-if="markers.length == 1">
        <div @click="call">经度：{{markers[0]&& markers[0].coordinates_mercator[0]}}</div>
        <div>纬度：{{markers[0] && markers[0].coordinates_mercator[1]}}</div>
      </div>
      <div v-else style="white-space: nowrap;">数量：{{markers.length}}</div>
    </div>
  `,
  data () {
    return {
      markers: [{}],
      ajaxData: {
        address: ''
      }
    }
  },
  methods: {
    call () {
      
    }
  },
  watch: {
    markers (val) {
      console.log(val.length)
    }
  }
}
let opts = {
  marker: {
    icon: icon,
    offsetX: -15,
    offsetY: -15,
    width: 30,
    height: 30,
    methods: {
      click (data, marker) {
      }
    },
  },
  infoWindow: {
    el: infoWindow,
    fetch: () => {
      return Promise.resolve({address: '幻想乡'})
    }
  },
  cluster: {
    marker: {
      icon:clusterIcon,
      offsetX: -16,
      offsetY: -16,
      textStyle: {
        fontSize: '12px',
        color: 'red',
        left: '18px',
        top: '15px',
        // transform: 'translate(10px, 10px)'
      },
      methods: {
        click(data) {
        }
      },
    },
    gridSize: 60,
    minClusterSize: 3,
    maxZoom: 18,
    // isAverageCenter: true,
    infoWindow: {
      el: infoWindow,
      fetch: () => {
        return Promise.resolve({address: '幻想乡'})
      },
      aotuOpen: true
    },
  }
}

// let layer = new wasmCluster(map, pts, opts)
let layer2 = new jsCluster(map, pts, opts)
window.layer = layer2

let form = document.querySelector('#changNum')
form.addEventListener('submit', (e) => {
  e.preventDefault()
  let val = form.querySelector('#num').value
  let points = []
  for (var j = 0; j< +val; j++) {
    points.push({
        location:{
          lng: Math.random() * 40 + 80,
          lat: Math.random() * 30 + 18,
        },
      })
  }
  layer.setMarkers(points)
})
window.map = map

// console.time('平面坐标转球面坐标')
// for(let i = 10000; i > 0 ; i--) {
//   let projection = map.getMapType().getProjection()
//   projection.pointToLngLat({x:1000000, y: 500000})
// }
// console.timeEnd('平面坐标转球面坐标')
