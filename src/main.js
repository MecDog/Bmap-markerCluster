import wasmCluster from './markerCluster_wasm'
import jsCluster from './markerCluster'
import Vue from 'vue'

let map = new BMap.Map("map", {enableMapClick: false})
map.centerAndZoom(new BMap.Point(105.3964,35.9093), 7)
map.enableScrollWheelZoom()
map.disableDoubleClickZoom()


let MAX = 10000

let pts = []
for (var j = 0; j< MAX; j++) {
  pts.push({
      location:{
        lng: Math.random() * 35 + 85,
        lat: Math.random() * 25 + 20,
      },
      gid: 'sdwasdw',
      name: '张三'

    })
}
let icon = require('./assets/map_gather.png')
let clusterIcon = require('./assets/persons.png')
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
      markers: [],
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
    minClusterSize: 2,
    maxZoom: 18,
    infoWindow: {
      el: infoWindow,
      fetch: () => {
        return Promise.resolve({address: '幻想乡'})
      },
      aotuOpen: true
    }
  }
}

// let layer = new wasmCluster(map, pts, opts)
let layer2 = new jsCluster(map, pts, opts)

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