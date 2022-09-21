<script lang="ts" setup>
import {computed, ref} from "vue";
import {useHead} from "../../../src";

const count = ref(0)
useHead({
  title: computed(() => `count: ${count.value}`),
  script: [{ children: 'console.log("a")', key: "a" }],
  link: [{ href: "/foo", rel: "stylesheet" }],
})
const click = () => {
  count.value++
}
</script>
<template>
<button
  class="counter"
  @click="click">
  {{ count }}
</button>
</template>
