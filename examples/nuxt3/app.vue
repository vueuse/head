<script setup lang="ts">
import { useHead } from "#head"

// useHead({
//   script: [
//     {
//       async: true,
//       src: 'https://utteranc.es/client.js',
//       repo: 'codybontecou/blog',
//       theme: 'github-dark',
//       crossorigin: 'anonymous',
//       'issue-term': computed(() => useRoute().path),
//     },
//   ],
// })

useHead({
  titleTemplate: (title) => `${title} | Title Site`,
})
</script>
<template>
  <div>
    <NuxtPage />
  </div>
</template>
