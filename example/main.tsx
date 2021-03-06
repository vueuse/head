import { createApp, ref, h, defineComponent, computed } from 'vue'
import {
  createRouter,
  createWebHistory,
  RouterLink,
  RouterView,
} from 'vue-router'
import { createHead, useHead } from '../src'
import Contact from './Contact.vue'

const Counter = defineComponent({
  setup() {
    const count = ref(0)
    useHead({
      title: computed(() => `count: ${count.value}`),
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
    {
      path: '/contact',
      component: Contact,
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

// @ts-expect-error
window.head = head
