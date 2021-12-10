import { createSSRApp, ref, h, defineComponent, computed } from 'vue'
import {
  createRouter,
  createWebHistory,
  createMemoryHistory,
  RouterLink,
  RouterView,
} from 'vue-router'
import { createHead, useHead } from '../src'
import Contact from './Contact.vue'

export const createApp = () => {
  const Counter = defineComponent({
    setup() {
      const count = ref(0)
      useHead({
        title: computed(() => `count: ${count.value}`),
        script: [{ children: 'console.log("a")', key: 'a' }],
        link: [{ href: '/foo', rel: 'stylesheet' }],
      })
      return () => (
        <button
          class="counter"
          onClick={() => {
            count.value++
          }}
        >
          {count.value}
        </button>
      )
    },
  })

  const Home = defineComponent({
    setup() {
      const title = ref('Home')
      useHead({
        title,
        base: { href: '/' },
        style: [{ children: `body {background: red}` }],
        htmlAttrs: {
          lang: 'en',
        },
        meta: [
          {
            name: 'description',
            content: 'desc',
          },
          {
            name: 'description',
            content: 'desc 2',
          },
          {
            property: 'og:locale:alternate',
            content: 'fr',
            key: 'fr',
          },
          {
            property: 'og:locale:alternate',
            content: 'zh',
            key: 'zh',
          },
        ],
      })
      return () => (
        <div>
          <h1>Home</h1>
          <RouterLink to="/about">About</RouterLink>{' '}
          <RouterLink to="/contact">Contact</RouterLink>
          <hr />
          <button
            class="change-home-title"
            onClick={() => (title.value = 'new title')}
          >
            Change home title (not really)
          </button>
          <Counter />
        </div>
      )
    },
  })

  const About = defineComponent({
    setup() {
      useHead({
        title: 'About',
      })
      return () => (
        <div>
          <h1>About</h1>
          <RouterLink to="/">Home</RouterLink>
        </div>
      )
    },
  })

  const router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
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
    ],
  })

  const app = createSSRApp({
    setup() {
      useHead({
        meta: [
          {
            name: 'global-meta',
            content: 'some global meta tag',
          },
        ],
      })
      return () => <RouterView />
    },
  })
  const head = createHead()

  app.use(head)
  app.use(router)

  return { app, head, router }
}
