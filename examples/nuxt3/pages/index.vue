<script lang="ts" setup>
import { useHead } from '#head'

const page = ref({
  title: 'Home',
  description: 'Home page description',
  image: 'https://nuxtjs.org/meta_400.png',
})

useHead({
  title: computed(() => `${page.value.title} | Nuxt`),
  // note: this is still XSS vulnerable
  // script: [
  // {
  //   children: 'alert(2)',
  // },
  // ],
  meta: [
    {
      name: 'description',
      content: computed(() => page.value.description),
    },
    {
      property: 'og:image',
      content: computed(() => page.value.image),
    },
  ],
})
</script>

<template>
  <div>
    <h1>Index</h1>
    <nuxt-link to="/second">
      second page
    </nuxt-link>
    <nuxt-link to="/red">
      red
    </nuxt-link>
  </div>
</template>
