// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import Categories from '../components/Categories.vue'
import Bookmarks from '../components/Bookmarks.vue'
import Profile from '../components/Profile.vue'
import Login from '../components/Login.vue'
import Signup from '../components/Signup.vue'
import CreatePost from '../components/CreatePost.vue'
import Users from '../components/Users.vue'
import UserDetails from '../components/UserDetails.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/categories', component: Categories },
  { path: '/bookmarks', component: Bookmarks },
  { path: '/profile', component: Profile },
  { path: '/login', component: Login, meta: { hideNavigation: true } },
  { path: '/signup', component: Signup, meta: { hideNavigation: true } },
  { path: '/create-post', component: CreatePost },
  { path: '/users', component: Users },
  { path: '/users/:id', component: UserDetails },
  { path: '/post/:id', component: () => import('../components/PostDetails.vue') },
  { path: '/posts', component: () => import('../components/PostsList.vue') },
  { path: '/edit-post/:id', component: CreatePost },
  { path: '/edit-profile', component: () => import('../components/EditProfile.vue') },
  { path: '/category/:slug', component: () => import('../components/CategoryPage.vue') },
  { path: '/settings', component: () => import('../components/Settings.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
