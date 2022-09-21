<script lang="ts" setup>
import { useHead } from "#head"

const page = ref({
  title: "Home",
  description: "Home page description",
  image: "https://nuxtjs.org/meta_400.png",
})

useHead({
  title: (() => `${page.value.title} | Nuxt`),
  meta: [
    {
      name: "description",
      content: (() => page.value.description),
    },
    {
      property: "og:image",
      content: (() => page.value.image),
    },
  ],
})
</script>
<template>
  <div>
    <h1>Index</h1>
  </div>
</template>
