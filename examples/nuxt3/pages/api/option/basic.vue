<script lang="ts">
import { defineNuxtComponent } from '#imports'
import type { MetaObject } from '@nuxt/schema'

export default defineNuxtComponent({
  data() {
    return {
      test: 'Options API',
    }
  },
  methods: {
    update() {
      this.test = 'new val'
    }
  },
  head() {
    return {
      title: () => this.test,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: () => this.test,
        },
      ],
      link: [
        {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
      ],
    }
  },
})
</script>

<template>
<div>
  options api - basic
  <button @click="update">
    update
  </button>
</div>
</template>
