<script lang="ts" setup>
import { Head, useHead } from '../../../src'

useHead({
  title: 'About',
  titleTemplate: '%s | About Template',
})
</script>

<template>
  <div>
    <Head>
      <meta name="page" content="about">
    </Head>
    <h1>About</h1>
    <RouterLink to="/">
      Home
    </RouterLink>
  </div>
</template>
