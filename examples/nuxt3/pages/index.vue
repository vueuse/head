<script lang="ts" setup>
const page = ref({
  title: "Home",
  description: "Home page description",
  image: "https://nuxtjs.org/meta_400.png",
})

const changeBg = ref(true)

useHead({
  title: computed(() => `${page.value.title} | Nuxt`),
  meta: [
    {
      name: "description",
      content: computed(() => page.value.description),
    },
    {
      property: "og:image",
      content: computed(() => page.value.image),
    },
  ],
  style: [
    computed(() => {
      console.log(changeBg)
      return {
        children: changeBg.value
          ? "body { background-color: antiquewhite; }"
          : "",
      }
    }),
  ],
})

const toggleBg = () => {
  changeBg.value = !changeBg.value
}
</script>
<template>
  <div>
    <h1>Index</h1>
    <button @click="toggleBg">switch bg</button>
    <nuxt-link to="/second">second page</nuxt-link>
  </div>
</template>
