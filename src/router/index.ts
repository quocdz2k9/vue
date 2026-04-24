import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import HistoryView from '../views/HistoryView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/register',
      name: 'register',
      component: Register
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView
    },
    {
      path: '/game/:id',
      name: 'game-detail',
      component: () => import('../views/GameDetail.vue')
    },
   {
      path: '/deposit',
      name: 'deposit',
      component: () => import('../views/DepositView.vue')
}
  ]
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  
  // Danh sách các trang bắt buộc phải đăng nhập mới được vào
  const secureRoutes = ['home', 'history', 'game-detail']

  if (secureRoutes.includes(to.name as string) && !auth.user) {
    next({ name: 'login' })
  } else if ((to.name === 'login' || to.name === 'register') && auth.user) {
    // Nếu đã đăng nhập mà cố tình vào trang login/register thì đá về home
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router

