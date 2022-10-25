<script>
import { Head, useHead } from '@vueuse/head'
import { version } from 'vue'
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    Head,
    HelloWorld,
  },
  setup() {
    useHead({
      title: `Hello world: ${version}`,
      meta: [
        { name: 'description', content: 'This is an example' },
        { property: 'og:title', content: 'Hello world' },
      ],
    })
  },
}
</script>

<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App" />
    <Head>
      <html lang="en" dir="ltr" class="mod" style="background-color: ghostwhite;" />
      <component is="style">
        h1 {
        color: seagreen;
        }
      </component>
    </Head>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
