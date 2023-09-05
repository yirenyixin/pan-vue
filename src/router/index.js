// 此文件专门负责项目的路由

import VueRouter from "vue-router"

// 引入组件
import Login from '../views/login/Login'
import Register from '../views/register/Register'
import Home from '../views/home/Home'
import Downloads from '../views/easypan/Downloads'
import MyResources from '../views/easypan/MyResources'
import RecycleBin from '../views/easypan/RecycleBin'
import Share from '../views/share/share'
import { Message } from "element-ui";


// 创建并暴露一个路由器
const router = new VueRouter({
    mode: 'history',
    routes: [
        {
            path: '*',
            component: Share // 这里偷懒把没有路由的网页直接转到分享页面
        },
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            component: Login
        },
        {
            path: '/register',
            component: Register
        },
        {
            path: '/home',
            component: Home,
            children: [
                {
                    path: 'myResources',
                    component: MyResources
                },
                {
                    path: 'downloads',
                    component: Downloads
                },
                {
                    path: 'recycleBin',
                    component: RecycleBin
                }
            ]
        }
    ]
})

// 导航守卫，前置处理
router.beforeEach((to, from, next) => {
    let isAuthenticated = !!sessionStorage.getItem('userInfo')
    // 如果路由要跳转到除了登录和注册的界面的话就判断是否已经登录，如果没有登录就强制跳到登录界面
    if (to.path !== '/login' && to.path !== '/register' && !isAuthenticated) {
        next({ path: '/login' })
        Message({
            message: '请先登录！',
            type: "warning",
        });
    } else next()
})

export default router;