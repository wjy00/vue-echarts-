<!-- 用于显示Map组件的页面 -->
<template>
  <div class="com-page">
    <map-graph />
  </div>
</template>

<script>
import Map from '@/components/Map'

export default {
  name: 'MapPage',
  // 组件名字不能去map，可能有内置标签 <map/>
  components: { MapGraph: Map },
}
</script>

<style>
</style>