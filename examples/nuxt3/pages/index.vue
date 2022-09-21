<script lang="ts" setup>
import { useHead } from "#head"

const page = ref({
  title: "Home",
  description: "Home page description",
  image: "https://nuxtjs.org/meta_400.png",
})

useHead({
  title: (() => `${page.value.title} | Nuxt`),
  meta: [
    {
      name: "description",
      content: (() => page.value.description),
    },
    {
      property: "og:image",
      content: (() => page.value.image),
    },
  ],
})

const isMobileNavOpen = ref(false);
function toggleMobileNav() { isMobileNavOpen.value = !isMobileNavOpen.value; }

// add extra body style to lock scrolling on main content while mobile nav is open
useHead({
  style: [{
    children: () => (isMobileNavOpen.value ? 'body { background-color: red; }' : ''),
  }],
});
</script>
<template>
  <div>
    <h1>Index</h1>
    <nuxt-link to="/second">second page</nuxt-link>
    <button @click="toggleMobileNav">toggle bg</button>
  </div>
</template>
