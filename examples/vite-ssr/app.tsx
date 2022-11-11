import { createSSRApp, defineComponent, ref } from 'vue'
import {
  RouterLink,
  RouterView,
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from 'vue-router'
import { createHead, useHead } from '../../src'
import Contact from './Contact.vue'

export const createApp = async () => {
  const Counter = defineComponent({
    setup() {
      const count = ref(0)
      useHead({
        title: (() => `count: ${count.value}`),
        link: [{ href: '/foo', rel: 'stylesheet' }],
      })
      useHead({
        script: [{ children: 'console.log("counter mount")', key: 'a' }],
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
        style: [{ children: 'body {background: salmon}' }],
        htmlAttrs: {
          lang: 'en',
        },
        noscript: [{ children: 'This app requires javascript to work' }],
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
          {
            name: 'custom-priority',
            content: 'of 1',
            tagPriority: 1,
          },
        ],
      })

      useHead({
        script: [
          {
            ['data-home-mount']: true,
            children: 'console.log(\'home mount\')',
            body: true,
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
        titleTemplate: '%s | About Template',
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

  const head = createHead({
    titleTemplate: '%s | @vueuse/head',
  })

  app.use(head)
  app.use(router)

  return { app, head, router }
}
