<script setup lang="ts">
useHead({
  htmlAttrs: {
    style: new Promise(resolve => setTimeout(() => resolve('background: red'), 500)),
  },
  title: 'red',
})
</script>

<template>
  <div>
    <h2>red bg</h2>
    <NuxtLink to="/">
      back
    </NuxtLink>
  </div>
</template>
