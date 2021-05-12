<template>
  <div class="com-container">
    <div class="com-chart"
         ref="hot_ref">
    </div>
    <span class="iconfont arr-left"
          @click="toleft"
          :style="comStyle">&#xe6ef;</span>
    <span class="iconfont arr-right"
          @click="toright"
          :style="comStyle">&#xe6ed;</span>
    <span class="cat-name"
          :style="comStyle">{{catName}}</span>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { getThemeValue } from '@/utils/theme_utils'

export default {
  name: 'Hot',
  data() {
    return {
      chartInstance: null,
      allData: null,
      currentIndex: 0, //当前展示的一级分类数据
      titleFontSize: 0,
    }
  },

  created() {
    //组件创造完成后，回调函数的注册
    this.$socket.registerCallBack('hotData', this.getData)
  },

  computed: {
    //获得一级标题
    catName() {
      if (this.allData) {
        return this.allData[this.currentIndex].name
      } else {
        return ''
      }
    },
    comStyle() {
      return {
        fontSize: this.titleFontSize + 'px',
        color: getThemeValue(this.theme).titleColor,
      }
    },
    ...mapState(['theme']),
  },
  mounted() {
    this.initChart()
    // this.getData()
    // 发送数据给服务器，获取数据
    this.$socket.send({
      action: 'getData',
      socketType: 'hotData',
      chartName: 'hotproduct',
      value: '',
    })
    //页面加载完成主动适配屏幕
    this.screenAdapter()
    //监听浏览器窗口大小变化
    window.addEventListener('resize', this.screenAdapter)
  },
  destroyed() {
    // 组件销毁时,需要取消监听器
    window.removeEventListener('resize', this.screenAdapter)
  },

  methods: {
    //1.初始化图表对象
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.hot_ref, this.theme)
      const initOption = {
        title: {
          text: '▎热销商品占比',
          left: 20,
          top: 20,
        },
        legend: {
          top: '15%',
          icon: 'circle',
        },
        tooltip: {
          show: true,

          //工具提示的内容，arg是每个扇区的数据
          formatter: (arg) => {
            // console.log(arg)
            const thirdCategory = arg.data.children
            // 计算出所有三级分类的数值总和
            let total = 0
            thirdCategory.forEach((item) => {
              total += item.value
            })
            let retStr = ''
            thirdCategory.forEach((item) => {
              // 模板字符串
              retStr += `
              ${item.name}:${parseInt((item.value / total) * 100) + '%'}
              <br/>
              `
            })
            return retStr
          },
        },
        series: [
          {
            type: 'pie',
            //默认情况不显示
            label: {
              fontSize: 18,
            },
            //高亮状态的样式
            emphasis: {
              label: {
                show: true,
              },
            },
          },
        ],
      }
      this.chartInstance.setOption(initOption)
    },
    //2.获取数据   并调用updateChart()方法
    async getData(ret) {
      // const { data: ret } = await this.$http.get('hotproduct')
      this.allData = ret
      // console.log(this.allData)
      this.updateChart()
    },
    //3.处理数据更新图表
    updateChart() {
      const legendData = this.allData[this.currentIndex].children.map(
        (item) => {
          return item.name
        }
      )
      const seriesData = this.allData[this.currentIndex].children.map(
        (item) => {
          return {
            name: item.name,
            value: item.value,
            // children数据让formatter中的arg能拿到三级分类数据
            children: item.children,
          }
        }
      )
      const dataOption = {
        legend: {
          legendData,
        },
        series: [
          {
            data: seriesData,
          },
        ],
      }
      this.chartInstance.setOption(dataOption)
    },
    //4.分辨率的适配
    screenAdapter() {
      this.titleFontSize = (this.$refs.hot_ref.offsetWidth / 100) * 3.6
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: this.titleFontSize,
          },
        },
        series: [
          {
            // 饼图半径
            radius: this.titleFontSize * 4.5,
            // 中心点
            center: ['50%', '60%'],
          },
        ],
        legend: {
          itemWidth: this.titleFontSize, //图例宽度
          itemHeight: this.titleFontSize, //图例高度
          itemGap: this.titleFontSize / 2, // 图例间距
          textStyle: {
            fontSize: this.titleFontSize * 0.8, //图例文字大小
          },
        },
        tooltip: {
          //修改大小
          textStyle: {
            fontSize: this.titleFontSize / 1.5,
          },
        },
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    //5.点击事件，向前、向后翻页
    toleft() {
      this.currentIndex--
      if (this.currentIndex < 0) {
        this.currentIndex = this.allData.length - 1
      }
      this.updateChart()
    },
    toright() {
      this.currentIndex++
      if (this.currentIndex > this.allData.length - 1) {
        this.currentIndex = 0
      }
      this.updateChart()
    },
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

<style scoped>
.arr-left {
  position: absolute;
  left: 10%;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: white;
}
.arr-right {
  position: absolute;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: white;
}
.cat-name {
  position: absolute;
  left: 80%;
  bottom: 20px;
  color: white;
}
</style>