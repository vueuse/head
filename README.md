<h1 align='center'>@vueuse/head</h1>

<p align="center">
<a href="https://www.npmjs.com/package/@vueuse/head" target="__blank"><img src="https://img.shields.io/npm/v/@vueuse/head?color=a1b858&label=" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/@vueuse/head" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@vueuse/head?color=50a36f&label="></a>
<br>
<a href="https://github.com/vueuse/head" target="__blank"><img alt="GitHub stars" src="https://img.shields.io/github/stars/vueuse/head?style=social"></a>
</p>

<p align="center">
A <a href="https://v3.vuejs.org/guide/composition-api-introduction.html">Vue composition API</a> to manage your document head.
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

## Features

- ✨ Best practice head with deduping and default ordering
- 🤖 SSR ready
- 🔨 Deeply reactive with computed getter support
- 🌳 Fully typed with augmentation support (powered by [zhead](https://github.com/harlan-zw/zhead))

## Installation

```bash
npm i @vueuse/head
# Or Yarn
yarn add @vueuse/head
```

> Requires vue >= v3 or >=2.7

For instructions on setting up @vueuse/head as an integration, see [integration](#integration).

## API

### `useHead(head: MaybeComputedRef<HeadObject>)`

Used to modify the head of the document. You can call this function in any page or component.

All values are reactive and support ref and computed getter syntax.

To provide inner content you should use the `textContent` attribute (previously `children` which is deprecated).

Note: All values provided to `useHead` will be encoded to avoid XSS injection. If you need to insert raw data use `useHeadRaw`.

#### Example

```ts
const myPage = ref({
  description: 'This is my page',
})
const title = ref('title')
useHead({
  // ref syntax
  title,
  meta: [
    // computer getter syntax  
    { name: 'description', content: () => myPage.value.description },
  ],
  style: [
    { type: 'text/css', textContent: 'body { background: red; }' },
  ],
  script: [
    // primitive values are also fine
    { 
      src: 'https://example.com/script.js',
      defer: true
    },
  ],
})
```

### Types

You can check [@zhead/schema](https://github.com/harlan-zw/zhead/blob/main/packages/schema/src/head.ts) for full types.

```ts
interface HeadObject {
  title?: MaybeRef<string>
  titleTemplate?: MaybeRef<string> | ((title?: string) => string)
  meta?: MaybeRef<HeadAttrs[]>
  link?: MaybeRef<HeadAttrs[]>
  base?: MaybeRef<HeadAttrs>
  style?: MaybeRef<HeadAttrs[]>
  script?: MaybeRef<HeadAttrs[]>
  noscript?: MaybeRef<HeadAttrs[]>
  htmlAttrs?: MaybeRef<HeadAttrs>
  bodyAttrs?: MaybeRef<HeadAttrs>
}
```

### `useHeadRaw(head: MaybeComputedRef<HeadObject>)`

Has the same functionality as `useHead` but does not encode values. This is useful for inserting raw data such as scripts
and attribute events.

When inserting raw inner content you should use `innerHTML`.

```ts
useHeadRaw({
  bodyAttrs: {
    onfocus: 'alert("hello")',
  },
  script: [
    {
      innerHTML: 'alert("hello world")',
    },
  ],
})
```

#### Deduping

For `meta` tags, we use `name` and `property` to prevent duplicated tags, you can instead use the `key` attribute if the same `name` or `property` is allowed:

```ts
useHead({
  meta: [
    {
      property: "og:locale:alternate",
      content: "zh",
      key: "zh",
    },
    {
      property: "og:locale:alternate",
      content: "en",
      key: "en",
    },
  ],
})
```

#### Body Tags

To render tags at the end of the `<body>`, set `body: true` in a HeadAttrs Object.

```ts
useHeadRaw({
  script: [
    {
      children: `console.log('Hello world!')`,
      body: true,
    },
  ],
})
```

#### Text Content

To set the `textContent` of an element, use the `children` attribute:

```ts
useHead({
  style: [
    {
      children: `body {color: red}`,
    },
  ],
  noscript: [
    {
      children: `Javascript is required`,
    },
  ],
})
```

`useHead` also takes reactive object or ref as the argument, for example:

```ts
const head = reactive({ title: "Website Title" })
useHead(head)
```

```ts
const title = ref("Website Title")
useHead({ title })
```

#### Render Priority

> :warning: Experimental feature
> Only available when rendering SSR.

To set the render priority of a tag you can use the `renderPriority` attribute:

```ts
useHead({
  script: [
    {
      src: "/not-important-script.js",
    },
  ],
})

useHead({
  script: [
    // will render first
    {
      src: "/very-important-script.js",
      renderPriority: 1 // default is 10, so will be first
    },
  ],
})
```

The following special tags have default priorities:

- -2 &lt;meta charset ...&gt;
- -1 &lt;base&gt;
- 0 &lt;meta http-equiv=&quot;content-security-policy&quot; ...&gt;

All other tags have a default priority of 10: <meta>, <script>, <link>, <style>, etc

### `<Head>` component

Besides `useHead`, you can also manipulate head tags using the `<Head>` component:

```vue
<script setup lang="ts">
import { Head } from "@vueuse/head"
</script>

<template>
  <Head>
    <title>Hello World</title>
    <base href="/base" />
    <html lang="en-US" class="theme-dark" />
  </Head>
</template>
```

Note that you need to use `<html>` and `<body>` to set `htmlAttrs` and `bodyAttrs` respectively, children for these two tags and self-closing tags like `<meta>`, `<link>` and `<base>` are also ignored.

## Integration

For integrating @vueuse/head with a framework.

### Examples

- [Nuxt - vueuse-head.plugin.ts](https://github.com/nuxt/framework/blob/main/packages/nuxt/src/head/runtime/lib/vueuse-head.plugin.ts)
- [Vite - SSG](https://github.com/antfu/vite-ssg/blob/main/src/client/index.ts)

### Usage

Register the Vue plugin:

```ts
import { createApp } from "vue"
import { createHead } from "@vueuse/head"

const app = createApp()
const head = createHead()

app.use(head)

app.mount("#app")
```

Manage `head` with the composition API `useHead` in your component:

```vue
<script>
import { defineComponent, reactive } from "vue"
import { useHead } from "@vueuse/head"

export default defineComponent({
  setup() {
    const siteData = reactive({
      title: `My website`,
      description: `My beautiful website`,
    })

    useHead({
      // Can be static or computed
      title: () => siteData.title,
      meta: [
        {
          name: `description`,
          content: () => siteData.description,
        },
      ],
    })
  },
})
</script>
```

### Server-side rendering

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

</html>
`
```

### API

#### `createHead(head?: HeadObject | Ref<HeadObject>)`

Create the head manager instance.

### `renderHeadToString(head: Head)`

- Returns: `HTMLResult`

```ts
export interface HTMLResult {
  // Tags in `<head>`
  readonly headTags: string
  // Attributes for `<html>`
  readonly htmlAttrs: string
  // Attributes for `<body>`
  readonly bodyAttrs: string
  // Tags in `<body>`
  readonly bodyTags: string
}
```

Render the head manager instance to HTML tags in string form.

## Sponsors

[![sponsors](https://sponsors-images.egoist.sh/sponsors.svg)](https://github.com/sponsors/egoist)

## License

MIT &copy; [EGOIST](https://egoist.sh)
