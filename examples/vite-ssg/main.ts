import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import Home from './pages/index.vue'
import About from './pages/about.vue'
import Contact from './pages/contact.vue'

const routes = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/about',
    component: About,
  },
  {
    path: '/contact',
    component: Contact,
  },
  {
    path: '/ssr/dedup',
    component: () => import('./pages/ssr/dedup.vue'),
  },
]

// `export const createApp` is required instead of the original `createApp(App).mount('#app')`
export const createApp = ViteSSG(
  // the root component
  App,
  // vue-router options
  { routes },
  // function to have custom setups
  // ({ app, router, routes, isClient, initialState }) => {
  //   // install plugins etc.
  // },
)
