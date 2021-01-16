import { createApp, ref, h, defineComponent } from 'vue'
import {
  createRouter,
  createWebHistory,
  RouterLink,
  RouterView,
} from 'vue-router'
import { createHead, useHead } from '../src'

const Home = defineComponent({
  setup() {
    const count = ref(0)
    useHead(() => ({
      title: `count: ${count.value}`,
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
    }))
    return () => (
      <div>
        <h1>Home</h1>
        <RouterLink to="/about">About</RouterLink>
        <hr />
        <button
          onClick={() => {
            count.value++
          }}
        >
          {count.value}
        </button>
      </div>
    )
  },
})

const About = defineComponent({
  setup() {
    useHead(() => ({
      title: 'About',
    }))
    return () => (
      <div>
        <h1>About</h1>
        <RouterLink to="/">Home</RouterLink>
      </div>
    )
  },
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: '/about',
      component: About,
    },
  ],
})

const app = createApp({
  setup() {
    return () => <RouterView />
  },
})
const head = createHead()

app.use(head)
app.use(router)

app.mount('#app')
