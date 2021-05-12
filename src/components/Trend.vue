<template>
  <div class="com-container">
    <div class="title"
         :style="comStyle">
      <span>{{'▎  '+showTitle}}</span>
      <span class="iconfont title-icon"
            @click="showChoice = !showChoice"
            :style="comStyle">&#xe6eb;</span>
      <div class="select-con"
           v-show="showChoice"
           :style="marginStyle">
        <div class="select-item"
             v-for="item in selectTypes"
             :key="item.key"
             @click="handleSelect(item.key)">
          {{ item.text }}
        </div>
      </div>
    </div>
    <div class="com-chart"
         ref="trend_ref">
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { getThemeValue } from '@/utils/theme_utils'

export default {
  name: 'Trend',
  data() {
    return {
      chartInstance: null,
      allData: null,
      showChoice: false, //显示可选项
      choiceType: 'map', // 显示的数据的类型（所需要获取的数据的type）
      titleFontSize: 0, // 指明标题字体大小
    }
  },

  created() {
    //组件创造完成后，回调函数的注册
    this.$socket.registerCallBack('trendData', this.getData)
  },
  mounted() {
    this.initChart()
    // this.getData()
    // 发送数据给服务器，获取数据
    this.$socket.send({
      action: 'getData',
      socketType: 'trendData',
      chartName: 'trend',
      value: '',
    })
    this.screenAdapter()
    window.addEventListener('resize', this.screenAdapter)
  },
  destroyed() {
    window.removeEventListener('resize', this.screenAdapter)
    // 组件销毁时，回调函数取消注册
    this.$socket.unRegisterCallBack('trendData')
  },

  computed: {
    // 获取数据种类
    selectTypes() {
      if (this.allData) {
        // 起初当前选项的条目
        return this.allData.type.filter((item) => {
          return item.key !== this.choiceType
        })
      } else {
        return []
      }
    },
    // 获取当前类型下的标题
    showTitle() {
      if (this.allData) {
        return this.allData[this.choiceType].title
      } else {
        return ''
      }
    },
    //设置标题样式
    comStyle() {
      return {
        fontSize: this.titleFontSize + 'px',
        fontWeight: 700,
        color: getThemeValue(this.theme).titleColor,
      }
    },
    // 调整边距，使下拉条目和标题对齐
    marginStyle() {
      return {
        marginLeft: this.titleFontSize * 0.9 + 'px',
        background: 'rgba(0, 0, 0, 0)',
      }
    },
    ...mapState(['theme']),
  },

  methods: {
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.trend_ref, this.theme)
      const initOption = {
        xAxis: {
          type: 'category',
          boundaryGap: false, //是否需要间隙
        },
        yAxis: {
          type: 'value',
        },
        grid: {
          top: '35%',
          left: '2%',
          right: '4%',
          bottom: '1%',
          containLabel: true, // 距离包含坐标轴上的文字
        },
        tooltip: {
          trigger: 'axis', // 文字提示
        },
        legend: {
          left: 20,
          top: '15%',
          icon: 'circle', // 显示的形状
        },
      }
      this.chartInstance.setOption(initOption)
    },

    //ret是服务端发送给客户端的数据
    getData(ret) {
      // const { data: ret } = await this.$http.get('trend')
      this.allData = ret
      // console.log(allData)
      this.updateChart()
    },

    updateChart() {
      // 半透明的颜色值
      const colorArr1 = [
        'rgba(11, 168, 44, 0.5)',
        'rgba(44, 110, 255, 0.5)',
        'rgba(22, 242, 217, 0.5)',
        'rgba(254, 33, 30, 0.5)',
        'rgba(250, 105, 0, 0.5)',
      ]
      // 全透明的颜色值
      const colorArr2 = [
        'rgba(11, 168, 44, 0)',
        'rgba(44, 110, 255, 0)',
        'rgba(22, 242, 217, 0)',
        'rgba(254, 33, 30, 0)',
        'rgba(250, 105, 0, 0)',
      ]
      const timeArr = this.allData.common.month //月份（类目轴数据）
      const valueArr = this.allData[this.choiceType].data // （y轴数据）
      // 多条曲线将数据存放在一个数组当中,返回值直接为series
      const seriesArr = valueArr.map((item, index) => {
        return {
          name: item.name,
          type: 'line',
          data: item.data,
          stack: 'map', //堆叠图，将stack设为同一个值
          //颜色渐变
          areaStyle: {
            color: new this.$echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: colorArr1[index] },
              { offset: 1, color: colorArr2[index] },
            ]),
          },
        }
      })
      // 每条折线对应name
      const legendArr = valueArr.map((item) => {
        return item.name
      })

      const dataOption = {
        xAxis: {
          data: timeArr,
        },
        legend: {
          data: legendArr,
        },
        series: seriesArr,
      }
      this.chartInstance.setOption(dataOption)
    },

    screenAdapter() {
      this.titleFontSize = (this.$refs.trend_ref.offsetWidth / 100) * 3.6
      const adapterOption = {
        legend: {
          itemWidth: this.titleFontSize, //图例宽度
          itemHeight: this.titleFontSize, //图例高度
          itemGap: this.titleFontSize, // 图例间距
          textStyle: {
            fontSize: this.titleFontSize * 0.8, //图例文字大小
          },
        },
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
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },

    handleSelect(currentType) {
      this.choiceType = currentType
      //获取数据完成后需要更新图表
      this.updataChart()
      this.showChoice = false
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

<style lang='less' scoped>
.title {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 99;
  color: white;

  .title-icon {
    margin-left: 10px;
    cursor: pointer;
  }

  .select-con {
    background-color: #222733;
  }
}
</style>