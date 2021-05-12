<!-- 用于显示Stock组件的页面 -->
<template>
  <div class="com-page">
    <stock />
  </div>
</template>

<script>
import Stock from '@/components/Stock'

export default {
  name: 'StockPage',
  components: { Stock },
}
</script>

<style>
</style>