<script lang="ts" setup>
import { useHead } from "#head"


// add extra body style to lock scrolling on main content while mobile nav is open
useHead({
  style: [{
    children: 'body { background-color: green; }',
  }],
});
</script>
<template>
  <div>
    <h1>Second</h1>
    <nuxt-link to="/">back</nuxt-link>
  </div>
</template>
