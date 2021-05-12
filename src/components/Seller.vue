<!-- 销量统计的横向柱状图 -->
<template>
  <div class="com-container">
    <div class="com-chart"
         ref="seller_ref">
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Seller',
  data() {
    return {
      chartInstance: null,
      allData: null, //保存服务器返回的数据，在更新图表中使用
      currentPage: 1, //当前显示的页数
      totalPage: 0, //总共的页数
      timerId: null, //定时器的标识,用于图表销毁后清除定时器
    }
  },

  created() {
    //组件创造完成后，回调函数的注册
    this.$socket.registerCallBack('sellerData', this.getData)
  },
  mounted() {
    // 在DOM元素加载完成后调用  ===
    this.initChart()
    // this.getData()
    // 发送数据给服务器，获取数据
    this.$socket.send({
      action: 'getData',
      socketType: 'sellerData',
      chartName: 'seller',
      value: '',
    })
    //页面加载完成主动适配屏幕
    this.screenAdapter()
    //监听浏览器窗口大小变化
    window.addEventListener('resize', this.screenAdapter)
  },

  destroyed() {
    // 组件销毁时,取消定时器,监听器
    clearInterval(this.timerId)
    window.removeEventListener('resize', this.screenAdapter)
  },

  methods: {
    // 1.初始化echart实例对象
    initChart() {
      // 通过ref直接拿到DOM元素对象  ===  将方法保存在data当中
      this.chartInstance = this.$echarts.init(this.$refs.seller_ref, this.theme)
      // 对图表初始化配置的控制(除了数据,大小之外的配置)
      const initOption = {
        // 标题样式
        title: {
          text: '▎商家销售统计',
          left: 20,
          top: 20,
        },
        // 坐标轴样式
        grid: {
          top: '20%',
          left: '3%',
          right: '6%',
          bottom: '3%',
          containLabel: true, // 距离包含坐标轴上的文字
        },
        xAxis: {
          type: 'value',
        },
        yAxis: {
          type: 'category',
        },
        tooltip: {
          //鼠标移上柱状条后展示效果
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            z: 0,
            lineStyle: {
              color: '#2D3443',
            },
          },
        },
        series: [
          {
            type: 'bar',
            label: {
              // 设置数值文字
              show: true,
              position: 'right',
              textStyle: {
                color: 'white',
              },
            },
            itemStyle: {
              //设置每个柱的样式
              // echarts.graphic.LinearGradient(x1,y1,x2,y2,[])
              color: new this.$echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#5052EE' }, //0%的颜色值
                { offset: 1, color: '#AB6EE5' }, //100%的颜色值
              ]), //设置渐变色  ************
            },
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

    // 2.获取服务器数据(使用async和await解析返回的Promise对象)
    async getData(ret) {
      // 解构出data数据 ===
      // const { data: ret } = await this.$http.get('seller')
      this.allData = ret
      // 通过sort()方法对数据进行排序  ===
      this.allData.sort((a, b) => {
        return a.value - b.value //从小到大排序
      })
      // 计算页数，每5个为一页
      this.totalPage = Math.ceil(this.allData.length / 5) //向上取整 Math.ceil()  ===
      this.updateChart()
      // 启动定时器
      this.startInterval()
    },

    // 3.处理数据，更新图表
    updateChart() {
      // 分页展示数据
      const start = (this.currentPage - 1) * 5
      const end = this.currentPage * 5
      const showData = this.allData.slice(start, end)

      // 通过map函数获取数据中key为name的value  === (map方法会遍历数组中的对象)
      const sellerName = showData.map((item) => {
        return item.name
      })
      const sellerValue = showData.map((item) => {
        return item.value
      })
      // (数据的配置) -- 其他配置 line-36
      const dataOption = {
        yAxis: {
          data: sellerName,
        },
        series: [
          {
            data: sellerValue,
          },
        ],
      }
      this.chartInstance.setOption(dataOption)
    },

    // 4.设置定时器，循环展示数据
    startInterval() {
      if (this.timerId) {
        clearInterval(this.timerId)
      }
      this.timerId = setInterval(() => {
        this.currentPage++
        if (this.currentPage > this.totalPage) {
          this.currentPage = 1
        }
        this.updateChart() //每次变化都需调用updateChart()方法重新加载图表
      }, 3000)
    },

    // 5.浏览器大小发生变化,实现屏幕适配
    screenAdapter() {
      const titleFontSize = (this.$refs.seller_ref.offsetWidth / 100) * 3.6
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
        // 柱的阴影
        tooltip: {
          axisPointer: {
            lineStyle: {
              width: titleFontSize,
            },
          },
        },
        series: [
          {
            barWidth: titleFontSize, // 柱的宽度
            //数值显示文字的大小
            label: {
              textStyle: {
                fontSize: titleFontSize / 1.5,
              },
            },
            itemStyle: {
              barBorderRadius: [0, titleFontSize / 2, titleFontSize / 2, 0], //设置四个角的圆角半径
            },
          },
        ],
      }
      this.chartInstance.setOption(adapterOption) // 适配图表内的大小
      this.chartInstance.resize() // 适配图表大小
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