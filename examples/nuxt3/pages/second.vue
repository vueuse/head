<script lang="ts" setup>
await new Promise((resolve) => setTimeout(resolve, 1000))

const title = ref("Intermediately title with 1s delay")

useHead({
  title,
  bodyAttrs: {
    class: "new-bg",
  },
  style: [
    // this is an example of the side effects of this rendering strategy
    // this style won't be hydrated at all
    {
      children: `.new-bg { background-color: lemonchiffon; } h2 { color: ${
        process.server ? "red" : "lime"
      }; }`,
    },
  ],
})

const changeTitle = () => {
  title.value = "Intermediately title updated"
}

const finalTitle = computed(() => {
  return title.value.replace("Intermediately", "Final")
})
</script>
<template>
  <div>
    <h2>second page</h2>
    <p>has a 1 second delay on rendering</p>
    <ModifyTitle :title="finalTitle" />
    <button @click="changeTitle">change title</button>
    <nuxt-link to="/">first page</nuxt-link>
  </div>
</template>
