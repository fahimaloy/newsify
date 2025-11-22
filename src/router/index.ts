// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import Categories from '../components/Categories.vue'
import Bookmarks from '../components/Bookmarks.vue'
import Profile from '../components/Profile.vue'
import Login from '../components/Login.vue'
import Signup from '../components/Signup.vue'
import CreatePost from '../components/CreatePost.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/categories', component: Categories },
  { path: '/bookmarks', component: Bookmarks },
  { path: '/profile', component: Profile },
  { path: '/login', component: Login, meta: { hideNavigation: true } },
  { path: '/signup', component: Signup, meta: { hideNavigation: true } },
  { path: '/create-post', component: CreatePost },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
