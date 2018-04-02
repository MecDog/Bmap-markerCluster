# MarkerCluster
百度地图10W数量级的打点聚合，解决官方聚合的性能问题。  
![聚合效果](https://github.com/MecDog/Bmap-markerCluster/blob/dev/src/assets/sreenShot.png?raw=true)
## 对百度官方聚合优化的点
  我想这部分应该才是大家更关心的点，因此在此分享下优化的经验。  
  **1、聚合计算完成后，再进行dom操作**    
    百度原生聚合是计算一次，进行一个dom操作，然后进行下一次计算。不得不吐槽百度地图js是实习生还是后端人员写的，还看过其他开源库也有类似的问题。  
  **2、不使用Map.getDistence()来计算两点距离，而是使用平面坐标系（墨卡托坐标系）计算两点距离**  
    在聚合算法中，需要频繁使用getDistence（）来判断最近的聚合点，此方法性能损耗很大，10w个点聚合计算，需要3s以上的时间。而预先转换为平面坐标系（墨卡托坐标）后，可以使时间减少至360ms（一般200多ms）左右.  
  **3、使用webAssembly**  
    使用webAssembly可以提高一倍的js计算性能，时间减少至180ms(一般100ms左右)，可惜目前支持有限。本库提供了c++源码和对应wasm文件，大家可以尝试玩玩  
  **4、使用canva代替dom (当前并不支持)**  
    经测试，dom操作一般会占用80~100ms的时间，若使用canvas进行绘制，可以将时间缩短为5ms(没想到吧)。但缺点是对marker的拓展性上太弱，因此若不是对性能有极高的需求，不太建议，在实际使用中，经过第1和第2条的优化下，10W数量级的聚合操作基本还算流畅。  
  **5、使用vue模板来配置infoWindow，自定义infoWindow和Marker更方便**
## Example
```
import markerCluster from './markerCluster'

let map = new BMap.Map("map")
map.centerAndZoom(new BMap.Point(105.3964,35.9093), 7)
map.enableScrollWheelZoom()
map.disableDoubleClickZoom()

// 生成指定数量的随机点
let MAX = 1000

let data = []
for (var j = 0; j< MAX; j++) {
  data.push({
      location:{
        lng: Math.random() * 40 + 80,
        lat: Math.random() * 30 + 18,
      },
    })
}
let options = {
  marker: {
    // 设置非聚合点的图片
    icon: require('./assets/map_person.png'),
  },
  cluster: {
  // 设置聚合点的图片
    marker: {
      icon:require('./assets/map_people.png'),
      // 设置数字文本样式
      textStyle: {
        fontSize: '12px',
        color: 'red',
        left: '15px',
        top: '15px',
      },
    },
    gridSize: 60, //聚合计算时网格的像素大小，默认60
  }
}
let layer = new markerCluster(map, data, options)
```
## 参数说明

#### data
代表点集合的数组，要求每一项有location属性，例如:
```
var data = [
    {
        name: '张三',
        locaton: {
            lng: 101// 经度
            lat: 48 // 纬度
        }
    },
    {
        name: '李四',
        locaton: {
            lng: 105// 经度
            lat: 50 // 纬度
        }
    }
];
```
#### options
地图标注相关设置,分为单个点标注和聚合点标注。没有采用百度地图的默认marker，而是继承百度地图overlay，重新实现的自定义marker

```
{
  // 非聚合点的标注设置
  marker: {
    icon: require('./assets/map_people.png'), // 图像url
    offsetX: -15, //marker位置偏移距离，单位像素
    offsetY: -15, // 同上
    deg: 10, //旋转角度
    width: 30, // 图片宽度
    height: 30, // 图片高度
    methods: {
      click (data, marker) {
        // 点击事件
        // data为对应的一项数据
        // marker为对应的百度地图自定义overlay
      },
      mouseover (data, marker) {
       // mouseover事件
      }
    },
  },
  // 地图信息窗口设置,详细解释查看后续infowindow相关说明
  infoWindow: {
      el: vueComponent // vue组件，会自动帮你插入到地图中
      autoOpen: true // 默认点击marker会自动打开信息窗口
      fetch: (data) => {
          return new Promise()
      } //打开infoWindow时，会自动调用接口获取数据，并渲染infoWindow,约定返回promise对象 
  }，
  // 聚合点的相关设置
  cluster： {
        // 标注设置,除了textStyle设置，其余同上
      marker:{
        // 显示聚合点数量的文本样式，若没有此项则隐藏文本显示
          textStyle: {
              fontSize: '12px'
              //...
          }
      }
      // 聚合点的信息窗口设置，同上面infoWindow
      infoWindow: {
          //...
      },
      gridSize: 60//可理解为距离多少像素内，进行聚合
      minClusterSize:2 //最小的聚合数量，小于该数量的不能成为一个聚合，默认为2
      maxZoom：18//  最大聚合的地图缩放级别，大于该级别就不进行相应的聚合,默认18
  }
}
```
#### 自定义Marker
若默认的marker配置不满足你的需求，可以在marker配置添加createElement方法，构建自定义marker,例如：
```
{
    marker: {
        // data为对应的每一项数据
        createElement: function(data) {
            //构建自定义marker,返回一个dom
            //库会自动将你返回的dom插入到地图中
            
        },
        methods: {
            click (data,marker) {
                // 同上                
            },
            mouseover (data,marker) {
                 // 同上  
            }
        }
    }
}
```
### 关于infoWindow
infoWindow就是一个vue组件，在打开infoWindow时会自动填充相关数据，以及调用相关方法
```
{
    template: ``// vue模板
    data () {
        ajaxData: null，// fetch返回的数据会放在此对象上
        markers: [] //点击marker时，会自动将marker对应的数据填充进去，聚合点时会有多个数据，非聚合点则只有一个
    }，
    methods: {
        beforeFetch() {
            // 将调用的fectch填充至ajaxData时会调用此函数
        }，
        infoWindowShow () {
            // 显示infoWindow后，会调用此方法
        }，
        infoWindowHide () {
            // 关闭infoWindow后，会调用此方法
        }，
    }
}
```

## API

### markerCluster实例
**markerCluster.data**  实例化时传进来的数据  
**markerCluster.options**  实例化时的参数  
**markerCluster.infoWindow** 实例化的infowindow，继承自百度地图overlay  
**markerCluster.addMarker(data)**   添加数据  
**markerCluster.addMarkers(data)**  添加多项数据，data为数组  
**markerCluster.setMarkers(data)**  重置数据，data为数组  

### infoWindow实例
存在两个infowindow实例,markerCluster.infoWindow和markerCluster.options.infoWindow，分别对应非聚合点和聚合点  

**setPosition(point)** 设置infowindow位置，point为BMap,Point实例  
**show(param)** 显示infowindow,若配置了fetch,则会将param传给fecth作为参数，若param = false, 则不会调用fetch获取服务器数据  
**hide()** 隐藏infoWindow


