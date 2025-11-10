import {
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteRecordRaw,
} from 'vue-router'
import TabbarLayout from '@layout/index.vue'
import GlobalWrap from '@layout/GlobalWrap.vue'
import { IMSDK, initStore } from '@/utils/imCommon'
import conversationRouters from './modules/conversation'
import contactRouters from './modules/contact'
import profileRouters from './modules/profile'
import loginRouters from './modules/login'
import { getIMToken, getIMUserID } from '@/utils/storage'

const loginCheck = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  try {
    const { data: loginStatus } = await IMSDK.getLoginStatus()
    console.log('IM SDK 登录状态:', loginStatus)
    next()
  } catch (error) {
    console.log('IM SDK 未登录，检查 token')
    const IMToken = getIMToken()
    const IMUserID = getIMUserID()
    if (!IMToken || !IMUserID) {
      console.log('没有 token，跳转到登录页')
      next('/login')
      return
    }
    console.log('有 token，允许进入页面，等待 layout 初始化 SDK')
    // 有 token 就放行，让 layout 组件去初始化 SDK
    next()
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'GlobalWrap',
    component: GlobalWrap,
    children: [
      {
        path: '/',
        name: 'TabbarLayout',
        redirect: 'conversation',
        component: TabbarLayout,
        beforeEnter: loginCheck,
        children: [
          {
            path: '/conversation',
            name: 'Conversation',
            component: () => import('@pages/conversation/index/index.vue'),
          },
          {
            path: '/contact',
            name: 'Contact',
            component: () => import('@pages/contact/index/index.vue'),
          },
          {
            path: '/workbench',
            name: 'Workbench',
            component: () => import('@pages/workbench/index/index.vue'),
          },
          {
            path: '/profile',
            name: 'Profile',
            component: () => import('@pages/profile/index/index.vue'),
          },
        ],
      },
      {
        path: '/',
        name: 'Common',
        beforeEnter: loginCheck,
        children: [...conversationRouters, ...contactRouters, ...profileRouters],
      },
      ...loginRouters,
    ],
  },
]

export default routes
