import markerCluster from './markerCluster_wasm'
import customMarker from './customMarker'
import customInfoWindow from './customInfoWindow'
import jsCluster from './markerCluster'
import Vue from 'vue'

let map = new BMap.Map("map", {enableMapClick: false})
map.centerAndZoom(new BMap.Point(105.3964,35.9093), 7)
map.enableScrollWheelZoom()
map.disableDoubleClickZoom()
map.removeTileLayer()

let MAX = 10

let pts = []
for (var j = 0; j< MAX; j++) {
  pts.push({
      location:{
        lng: Math.random() * 40 + 80,
        lat: Math.random() * 30 + 18,
      },
    })
}
let icon = require('./assets/map_gather.png')
let clusterIcon = require('./assets/persons.png')
let infoWindow = {
  template: 
  `
    <div style="background-color:white">
      <div v-show ="ajaxData.address"> 地点：{{ajaxData.address}}</div>
      <div  v-if="markers.lengtg = 1">
        <div @click="call">经度：{{markers[0]&& markers[0].coordinates_mercator[0]}}</div>
        <div>纬度：{{markers[0] && markers[0].coordinates_mercator[1]}}</div>
      </div>
      <div v-else>
      <div>数量：{{markers.length}}</div>
      </div>
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
      console.log(this, this.$data)
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
        console.log(data)
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
      text: {
        fontSize: '12px',
        color: 'red',
        left: '15px',
        top: '15px',
        // transform: 'translate(10px, 10px)'
      },
      methods: {
        click(data) {
          console.log(data)
        }
      },
    },
    gridSize: 60,
    minClusterSize: 2,
    infoWindow: {
      el: infoWindow,
      fetch: () => {
        return Promise.resolve({address: '幻想乡'})
      }
    }
  }
}

let layer = new markerCluster(map, pts, opts)
// let layer2 = new jsCluster(map, pts, opts)
let projection = map.getMapType().getProjection()
map.addEventListener('moveend', () => {
  console.log( projection.lngLatToPoint(map.getCenter()))
  console.log(map.pointToPixel(map.getCenter()))
})
window.map = map