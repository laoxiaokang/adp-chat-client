import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalized
} from 'vue-router'
import { isLoggedIn } from '@/service/login'
import { httpService } from '@/service/httpService'


const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: { name: 'consult' },
    },
    {
      path: '/service',
      name: 'service',
      component: () => import('@/pages/Home.vue'),
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('@/pages/Home.vue'),
    },
    {
      path: '/report-upload',
      name: 'report-upload',
      component: () => import('@/components/ReportUpload.vue'),
    },
    {
      path: '/consult/:applicationId?',
      name: 'consult',
      component: () => import('@/pages/Home.vue'),
    },
    {
      path: '/:conversationId?',
      name: 'home',
      component: () => import('@/pages/Home.vue'),
    },
    {
      path: '/app/:applicationId?',
      name: 'app',
      component: () => import('@/pages/Home.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/Login.vue'),
    },
    {
      path: '/share/:shareId?',
      name: 'share',
      meta:{
        unauthorized: true
      },
      component: () => import('@/pages/Share.vue'),
    },
  ],
})

let entre = false
router.beforeEach(
  async (to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
    if (to.meta.unauthorized) {
      return
    } else {
      if (entre) {
        // 防止重复进入, axiosInstance.ts中会统一处理AccountUnauthorized错误，并跳转登录页
        console.log(`prevent re-entre`);
        return
      }
      // 配置AUTO_CREATE_ACCOUNT=true时，检查是否需要自动创建账号
      entre = true
      try {
        await httpService.get('/account/info')
      } catch {
      }
      entre = false
      
      if (to.name !== 'login' && !isLoggedIn()) {
        return { name: 'login' }
      } else if (to.name === 'login' && isLoggedIn()) {
        return { name: 'consult' }
      } else {
        return
      }
    }
  },
)

export default router
