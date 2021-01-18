# @vueuse/head

Document head manager for Vue 3.

**💛 Support the ongoing development of this project by [becoming a GitHub Sponsor](https://github.com/sponsors/egoist)**.

## Installation

```bash
npm i @vueuse/head
# Or Yarn
yarn add @vueuse/head
```

## Usage

Register the Vue plugin:

```ts
import { createApp } from 'vue'
import { createHead } from '@vueuse/head'

const app = createApp()
const head = createHead()

app.use(head)

app.mount('#app')
```

Manage `head` with the composition API `useHead` in your component:

```vue
<script>
import { defineComponent } from 'vue'
import { useHead } from '@vueuse/head'

export default defineComponent({
  setup() {
    useHead(() => ({
      title: `Website title`,
      meta: [
        {
          name: `description`,
          content: `Website description`,
        },
      ],
    }))
  },
})
</script>
```

### Server-side rendering

```ts
import { renderToString } from '@vue/server-renderer'
import { renderHeadToString } from '@vueuse/head'

const appHTML = await renderToString(yourVueApp)

// `head` is created from `createHead()`
const { headTags, htmlAttrs, bodyAttrs } = renderHeadToString(head)

const finalHTML = `
<html${htmlAttrs}>

  <head>
    ${headTags}
  </head>

  <body${bodyAttrs}>
    <div id="app">${appHTML}</div>
  </body>

</html>
`
```

## API

### `createHead()`

Create the head manager instance.

### `useHead(() => HeadObj)`

```ts
interface HeadObj {
  title?: string
  base?: Attrs
  meta?: Attrs[]
  link?: Attrs[]
  style?: Attrs[]
  script?: Attrs[]
  htmlAttrs?: Attrs
  bodyAttrs?: Attrs
}

interface Attrs {
  [attrName: string]: any
}
```

For `meta` tags, we use `name` and `property` to prevent duplicated tags, you can instead use the `key` attribute if the same `name` or `property` is allowed:

```ts
useHead(() => ({
  meta: [
    {
      property: 'og:locale:alternate',
      content: 'zh',
      key: 'zh',
    },
    {
      property: 'og:locale:alternate',
      content: 'en',
      key: 'en',
    },
  ],
}))
```

To set the `textContent` of an element, use the `children` attribute:

```ts
useHead(() => ({
  style: [
    {
      children: `body {color: red}`,
    },
  ],
}))
```

### `renderHeadToString(head: Head)`

- Returns: `HtmlResult`

```ts
interface HtmlResult {
  // Tags in `<head>`
  readonly headTags: string
  // Attributes for `<html>`
  readonly htmlAttrs: string
  // Attributes for `<body>`
  readonly bodyAttrs: string
}
```

Render the head manager instance to HTML tags in string form.

## License

MIT &copy; [EGOIST](https://egoist.sh)
