<script setup lang="ts">
import { useHead } from '#head'

useHead({
  title: 'Title',
  titleTemplate: title => `${title} | Title Site`,
})
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
