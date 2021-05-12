import Vue from 'vue'
import VueRouter from 'vue-router'

// import SellerPage from '@/views/SellerPage'
// import TrendPage from '@/views/TrendPage'
// import MapPage from '@/views/MapPage'
// import RankPage from '@/views/RankPage'
// import HotPage from '@/views/HotPage'
// import StockPage from '@/views/StockPage'
import ScreenPage from '@/views/ScreenPage'


Vue.use(VueRouter)

const routes = [{
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    component: ScreenPage
  },
]

const router = new VueRouter({
  routes
})

export default router