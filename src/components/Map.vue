<template>
  <div class="com-container"
       @dblclick="revertMap">
    <div class="com-chart"
         ref="map_ref">

    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

// 获取中国地图矢量数据
import axios from 'axios'
import chinaMap from '../../public/static/map/china.json'
import { getProvinceMapInfo } from '@/utils/map_utils.js'

export default {
  name: 'Map',
  data() {
    return {
      chartInstance: null,
      allData: null,
      mapData: {}, //获取的省份的地图矢量数据缓存
    }
  },

  created() {
    //组件创造完成后，回调函数的注册
    this.$socket.registerCallBack('mapData', this.getData)
  },
  mounted() {
    this.initChart()
    // this.getData()
    // 发送数据给服务器，获取数据
    this.$socket.send({
      action: 'getData',
      socketType: 'mapData',
      chartName: 'map',
      value: '',
    })
    this.screenAdapter()
    window.addEventListener('resize', this.screenAdapter)
    this.changeMap()
  },
  destroyed() {
    window.removeEventListener('resize', this.screenAdapter)
  },

  methods: {
    //1.初始化图表对象
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.map_ref, this.theme)
      this.$echarts.registerMap('china', chinaMap) // 注册地图图表
      const initOption = {
        title: {
          text: '▎商家分布',
          left: 20,
          top: 20,
        },
        geo: {
          type: 'map',
          map: 'china',
          top: '5%',
          bottom: '5%',
          itemStyle: {
            areaColor: '#2E72BF', //修改地图的颜色
            borderColor: '#333',
          },
          label: {
            //图形上的文本标签，可用于说明图形的一些数据信息
            show: true, //是否显示文本
            color: '#fff', //文本颜色
            fontSize: 15,
          },
        },
        legend: {
          left: '5%',
          bottom: '5%',
          orient: 'verticle', //图例排列方向
        },
      }
      this.chartInstance.setOption(initOption)
    },
    //2.获取数据   并调用updateChart()方法
    async getData(ret) {
      // const { data: ret } = await this.$http.get('map')
      this.allData = ret
      // console.log(this.allData)
      this.updateChart()
    },
    //3.处理数据更新图表
    updateChart() {
      // 图例数据
      const legendArr = this.allData.map((item) => {
        return item.name
      })
      const seriesArr = this.allData.map((item) => {
        // 返回的对象代表一个类型下的所有散点数据
        // 地图中显示散点数据，需要给图表增加配置，coordinateSystem: 'geo'
        return {
          type: 'effectScatter', //涟漪动画类型
          rippleEffect: {
            scale: 5, //动画变大
            brushType: 'stroke', //波纹设为空心
          },
          name: item.name,
          data: item.children,
          coordinateSystem: 'geo', // 散点使用地图坐标系统
        }
      })
      const dataOption = {
        series: seriesArr,
        legend: {
          data: legendArr, //图例
        },
      }
      this.chartInstance.setOption(dataOption)
    },
    //4.分辨率的适配
    screenAdapter() {
      const titleFontSize = (this.$refs.map_ref.offsetWidth / 100) * 3.6
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize,
          },
        },
        legend: {
          itemWidth: titleFontSize / 2, //图例宽度
          itemHeight: titleFontSize / 2, //图例高度
          itemGap: titleFontSize / 2, // 图例间距
          textStyle: {
            fontSize: titleFontSize / 2, //图例文字大小
          },
        },
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    //5.切换为省份地图
    changeMap() {
      // 点击切换为省份地图
      this.chartInstance.on('click', async (arg) => {
        // arg是被点击的省份相关信息
        const proviceInfo = getProvinceMapInfo(arg.name)
        // console.log(proviceInfo)
        //获取当前省份的地图矢量数据
        if (!this.mapData[proviceInfo.key]) {
          const ret = await axios.get(
            'http://localhost:8999' + proviceInfo.path
          )
          this.mapData[proviceInfo.key] = ret.data //缓存数据
          this.$echarts.registerMap(proviceInfo.key, ret.data) //注册图表
        }
        // console.log(ret)
        const changeOption = {
          geo: {
            map: proviceInfo.key,
          },
        }
        this.chartInstance.setOption(changeOption)
      })
    },
    //6.返回中国地图(dblclick监听双击)
    revertMap() {
      const revertOption = {
        geo: {
          map: 'china',
        },
      }
      this.chartInstance.setOption(revertOption)
    },
  },
  computed: {
    ...mapState(['theme']),
  },
  watch: {
    theme() {
      // console.log('主题切换了')
      this.chartInstance.dispose() // 销毁当前的图表
      this.initChart() // 重新以最新的主题名称初始化图表对象
      this.screenAdapter() // 完成屏幕的适配
      this.updateChart() // 更新图表的展示
    },
  },
}
</script>

<style>
</style>