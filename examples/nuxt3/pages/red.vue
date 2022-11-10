<script setup lang="ts">
useHead({
  style: [
    {
      children: 'body { background-color: red; }',
    }
  ],
  title: 'red',
})

useHead({
  script: [
    {
      src: 'https://js.stripe.com/v3/',
      onload: (e) => console.log('script loaded', e),
    }
  ],
}, { mode: 'client' })
</script>

<template>
  <div>
    <h2>red bg</h2>
    <NuxtLink to="/">
      back
    </NuxtLink>
  </div>
</template>
