<script setup>
import { ref } from "vue"
import { Head } from "../../src"

const count = ref(0)

const style = `button {color: red}`
</script>

<template>
  <Head>
    <title>{{ count }}</title>
    <html lang="en"></html>
    <body class="body"></body>
    <meta name="description" content="desc" />
    <component is="style">
      body { background: lightgreen; } {{ style }}</component
    >
  </Head>

  <router-link to="/">Back Home</router-link>

  <hr />

  <button @click="count++">{{ count }}</button>
</template>
