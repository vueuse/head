<script setup>
import { ref } from 'vue'
import { Head, useHead } from '../../src'

const count = ref(0)

useHead({
  script: [
    {
      src: 'https://js.stripe.com/v3/',
      defer: true,
      onload: (e) => {
        console.log(e);
      },
    },
  ],
})

const style = 'button {color: red}'
</script>

<template>
  <Head>
    <title>{{ count }}</title>
    <html lang="en" />
    <body class="body" />
    <meta name="description" content="desc">
    <component is="style">
      body { background: lightgreen; } {{ style }}
    </component>
  </Head>

  <router-link to="/">
    Back Home
  </router-link>

  <hr>

  <button @click="count++">
    {{ count }}
  </button>
</template>
