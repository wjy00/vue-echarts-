<template>
  <div class="com-container">
    <div class="com-chart"
         ref="stock_ref">
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Stock',
  data() {
    return {
      chartInstance: null,
      allData: null,
      currentIndex: 0, // 当前显示的数据页数
      timerId: null, //定时器的标识,用于图表销毁后清除定时器
    }
  },
  created() {
    //组件创造完成后，回调函数的注册
    this.$socket.registerCallBack('stockData', this.getData)
  },
  mounted() {
    this.initChart()
    // this.getData()
    // 发送数据给服务器，获取数据
    this.$socket.send({
      action: 'getData',
      socketType: 'stockData',
      chartName: 'stock',
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
      this.chartInstance = this.$echarts.init(this.$refs.stock_ref, this.theme)
      const initOption = {
        // 标题样式
        title: {
          text: '▎库存和销量分析',
          left: 20,
          top: 20,
        },
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
      // const { data: ret } = await this.$http.get('stock')
      this.allData = ret
      // console.log(this.allData)
      this.updateChart()
      this.startInterval()
    },
    //3.处理数据更新图表
    updateChart() {
      const centerArr = [
        ['18%', '40%'],
        ['50%', '40%'],
        ['82%', '40%'],
        ['34%', '75%'],
        ['66%', '75%'],
      ]
      const colorArr = [
        ['#4FF778', '#0BA82C'],
        ['#E5DD45', '#E8B11C'],
        ['#E8821C', '#E55445'],
        ['#5052EE', '#AB6EE5'],
        ['#23E5E5', '#2E72BF'],
      ]

      //获取当前页数的五个数据
      const start = this.currentIndex * 5
      const end = start + 5
      const showData = this.allData.slice(start, end)
      const seriesArr = showData.map((item, index) => {
        return {
          type: 'pie',
          center: centerArr[index],
          hoverAnimation: false, // 移除鼠标动画
          labelLine: {
            show: false, //移除指示线
          },
          label: {
            position: 'center', // 文字位置
            color: colorArr[index][0], //文字颜色
          },
          data: [
            {
              name: item.name + '\n\n' + item.sales,
              value: item.sales,
              itemStyle: {
                //渐变颜色设置
                color: new this.$echarts.graphic.LinearGradient(0, 1, 0, 0, [
                  {
                    offset: 0,
                    color: colorArr[index][0],
                  },
                  {
                    offset: 1,
                    color: colorArr[index][1],
                  },
                ]),
              },
            },
            {
              value: item.stock,
              itemStyle: {
                color: '#333843',
              },
            },
          ],
        }
      })

      const dataOption = {
        series: seriesArr,
      }
      this.chartInstance.setOption(dataOption)
    },
    //4.分辨率的适配
    screenAdapter() {
      const titleFontSize = (this.$refs.stock_ref.offsetWidth / 100) * 3.6
      const innerRadius = titleFontSize * 2.7
      const outterRadius = innerRadius * 1.125

      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize,
          },
        },
        series: [
          {
            type: 'pie',
            radius: [outterRadius, innerRadius],
            label: {
              fontSize: titleFontSize * 0.8,
            },
          },
          {
            type: 'pie',
            radius: [outterRadius, innerRadius],
            label: {
              fontSize: titleFontSize * 0.8,
            },
          },
          {
            type: 'pie',
            radius: [outterRadius, innerRadius],
            label: {
              fontSize: titleFontSize * 0.8,
            },
          },
          {
            type: 'pie',
            radius: [outterRadius, innerRadius],
            label: {
              fontSize: titleFontSize * 0.8,
            },
          },
          {
            type: 'pie',
            radius: [outterRadius, innerRadius],
            label: {
              fontSize: titleFontSize * 0.8,
            },
          },
        ],
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    //5.定时器用于改变当前页码 currentIndex
    startInterval() {
      if (this.timerId) {
        clearInterval(this.timerId)
      }
      this.timerId = setInterval(() => {
        if ((this.currentIndex + 1) * 5 < this.allData.length) {
          this.currentIndex++
        } else {
          this.currentIndex = 0
        }
        this.updateChart()
      }, 5000)
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