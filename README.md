<h1 align='center'>@vueuse/head</h1>

<p align="center">
<a href='https://github.com/harlan-zw/unhead/actions/workflows/test.yml'>
</a>
<a href="https://www.npmjs.com/package/@vueuse/head" target="__blank"><img src="https://img.shields.io/npm/v/@vueuse/head?style=flat&colorA=002438&colorB=28CF8D" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/@vueuse/head" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@vueuse/head?flat&colorA=002438&colorB=28CF8D"></a>
<a href="https://github.com/vueuse/head" target="__blank"><img alt="GitHub stars" src="https://img.shields.io/github/stars/vueuse/head?flat&colorA=002438&colorB=28CF8D"></a>
</p>


<p align="center">
Super-charged document head management for Vue, powered by <a href="https://unhead.harlanzw.com/">unhead</a>.
</p>

<p align="center">
<table>
<tbody>
<td align="center">
<img width="800" height="0" /><br>
Created by <a href="https://github.com/sponsors/egoist">egoist</a>, maintained by <a href="https://github.com/harlan-zw">harlan-zw</a> <br>
<sub>💛 Support ongoing development by sponsoring us.</sub><br> 
<sub>Follow <a href="https://twitter.com/harlan_zw">🐦 @harlan_zw</a> for updates  • Join <a href="https://discord.gg/275MBUBvgP">Discord</a> for support</sub><br>
<img width="800" height="0" />
</td>
</tbody>
</table>
</p>

## ✨ v1 released!

Read the announcement [post](https://harlanzw.com/blog/vue-use-head-v1), provide any feedback or questions in [this discussion](https://github.com/vueuse/head/discussions/161)

## Features

- 💎 Fully typed augmentable Schema
- 🧑‍🤝‍🧑 Side-effect based DOM patching, plays nicely your existing other tags and attributes
- 🍣 Intuitive deduping, sorting, title templates, class merging and more
- 🪝 Extensible hook / plugin based API

## Installation

```bash
npm i @vueuse/head
# Or Yarn
yarn add @vueuse/head
```

> Requires vue >= v3 or >=2.7

## Usage

### Vue 3

Register the Vue plugin:

```ts
import { createApp } from "vue"
import { createHead } from "@vueuse/head"

const app = createApp()
const head = createHead()

app.use(head)

app.mount("#app")
```

### Vue 2

Register the Vue plugin:

```ts
import Vue from 'vue'
import { createHead, HeadVuePlugin } from "@vueuse/head"

const head = createHead()
// needed for Vue 2
Vue.use(HeadVuePlugin, head)
Vue.use(head)

new Vue({
  render: h => h(App),
}).$mount('#app')
```

### SSR Rendering

```ts
import { renderToString } from "@vue/server-renderer"
import { renderHeadToString } from "@vueuse/head"

const appHTML = await renderToString(yourVueApp)

// `head` is created from `createHead()`
const { headTags, htmlAttrs, bodyAttrs, bodyTags } = renderHeadToString(head)

const finalHTML = `
<html${htmlAttrs}>

  <head>
    ${headTags}
  </head>

  <body${bodyAttrs}>
    <div id="app">${appHTML}</div>
    ${bodyTags}
  </body>

</html>`
```

## Further Documentation

Refer to the [unhead documentation](https://unhead.harlanzw.com/) for full API reference and more.

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
  </a>
</p>


## License

MIT &copy; [EGOIST](https://egoist.sh)
MIT License © 2022-PRESENT [Harlan Wilton](https://github.com/harlan-zw)
