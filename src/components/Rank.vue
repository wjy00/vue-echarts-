<template>
  <div class="com-container">
    <div class="com-chart"
         ref="rank_ref">
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Rank',
  data() {
    return {
      chartInstance: null,
      allData: null,
      startValue: 0, //区域缩放的起点值
      endValue: 9, //区域缩放的终点值
      timerId: null, //定时器的标识,用于图表销毁后清除定时器
    }
  },

  created() {
    //组件创造完成后，回调函数的注册
    this.$socket.registerCallBack('rankData', this.getData)
  },
  mounted() {
    this.initChart()
    // this.getData()
    // 发送数据给服务器，获取数据
    this.$socket.send({
      action: 'getData',
      socketType: 'rankData',
      chartName: 'rank',
      value: '',
    })
    //页面加载完成主动适配屏幕
    this.screenAdapter()
    //监听浏览器窗口大小变化
    window.addEventListener('resize', this.screenAdapter)
  },
  destroyed() {
    clearInterval(this.timerId)
    // 组件销毁时,需要取消监听器
    window.removeEventListener('resize', this.screenAdapter)
  },

  methods: {
    //1.初始化图表对象
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.rank_ref, this.theme)
      const initOption = {
        // 标题样式
        title: {
          text: '▎地区销售排行',
          left: 20,
          top: 20,
        },
        // 坐标轴样式
        grid: {
          top: '40%',
          left: '5%',
          right: '5%',
          bottom: '5%',
          containLabel: true, // 距离包含坐标轴上的文字
        },
        tooltip: {
          show: 'true',
        },
        xAxis: {
          type: 'category',
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            type: 'bar',
          },
        ],
      }
      this.chartInstance.setOption(initOption)

      // 监听鼠标事件,实现鼠标移入关闭定时器,移出开启
      this.chartInstance.on('mouseover', () => {
        clearInterval(this.timerId)
      })
      this.chartInstance.on('mouseout', () => {
        this.startInterval()
      })
    },
    //2.获取数据
    async getData(ret) {
      // const { data: ret } = await this.$http.get('rank')
      this.allData = ret
      // console.log(this.allData)
      this.allData.sort((a, b) => {
        return b.value - a.value //从小到大排序
      })
      this.updateChart()
      this.startInterval() //启动定时器
    },
    //3.处理数据更新图表
    updateChart() {
      // 渐变色颜色数据
      const colorArr = [
        ['#0BA82C', '#4FF778'],
        ['#2E72BF', '#23E5E5'],
        ['#5052EE', '#AB6EE5'],
      ]
      // 所有省份的数组
      const proviceArr = this.allData.map((item) => {
        return item.name
      })
      // 所有省份对应销售金额的数组
      const valueArr = this.allData.map((item) => {
        return item.value
      })
      const dataOption = {
        xAxis: {
          data: proviceArr,
        },
        //区域缩放(显示区域设置)
        dataZoom: {
          show: false,
          startValue: this.startValue,
          endValue: this.endValue,
        },
        series: [
          {
            data: valueArr,
            itemStyle: {
              // 根据数值改变颜色(渐变色)   arg参数
              color: (arg) => {
                let targetColor = []
                if (arg.value > 300) {
                  targetColor = colorArr[0]
                } else if (arg.value > 200) {
                  targetColor = colorArr[1]
                } else {
                  targetColor = colorArr[2]
                }
                return new this.$echarts.graphic.LinearGradient(0, 1, 0, 0, [
                  { offset: 0, color: targetColor[0] },
                  { offset: 1, color: targetColor[1] },
                ])
              },
            },
          },
        ],
      }
      this.chartInstance.setOption(dataOption)
    },
    //4.分辨率的适配
    screenAdapter() {
      const titleFontSize = (this.$refs.rank_ref.offsetWidth / 100) * 3.6
      const adapterOption = {
        xAxis: {
          axisLabel: {
            textStyle: {
              fontSize: 20, //更改x坐标轴文字大小
            },
          },
        },
        yAxis: {
          axisLabel: {
            textStyle: {
              fontSize: 20, //更改y坐标轴文字大小
            },
          },
        },
        title: {
          textStyle: {
            fontSize: titleFontSize,
          },
        },
        series: [
          {
            barWidth: titleFontSize, // 柱的宽度
            itemStyle: {
              barBorderRadius: [titleFontSize / 2, titleFontSize / 2, 0, 0], //设置四个角的圆角半径
            },
          },
        ],
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    // 5.设置定时器，改变区域缩放始末值
    startInterval() {
      if (this.timerId) {
        clearInterval(this.timerId)
      }
      //要停止定时器需要给标识
      this.timerId = setInterval(() => {
        this.startValue++
        this.endValue++
        if (this.endValue > this.allData.length - 1) {
          this.startValue = 0
          this.endValue = 9
        }
        this.updateChart()
      }, 2000)
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