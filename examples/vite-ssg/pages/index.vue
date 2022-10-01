<script lang="ts" setup>
import { ref } from 'vue'
import { Head } from '@vueuse/head'
import { useHead } from '../../../src'
import Counter from '../components/Counter.vue'

const title = ref('Home')
useHead({
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
      renderPriority: 1,
    },
  ],
  script: [
    {
      children: 'console.log(\'hi\')',
      body: true,
    },
  ],
})

const changeHomeTitle = () => {
  title.value = 'new title'
}
</script>

<template>
  <div>
    <Head>
      <meta name="page" content="index">
    </Head>
    <h1>Home</h1>
    <RouterLink to="/about">
      About
    </RouterLink>
    <RouterLink to="/contact">
      Contact
    </RouterLink>
    <hr>
    <button
      class="change-home-title"
      @click="changeHomeTitle"
    >
      Change home title (not really)
    </button>
    <Counter />
  </div>
</template>
