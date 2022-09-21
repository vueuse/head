<script lang="ts" setup>
import {useHead} from "../../src";

useHead({
  titleTemplate: "%s | @vueuse/head",
  meta: [
    {
      name: "global-meta",
      content: "some global meta tag",
    },
  ],
})
</script>
<template>
<RouterView />
</template>
