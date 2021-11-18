import anyTest, { TestInterface } from 'ava'
import { createSSRApp, ref, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { chromium, ChromiumBrowser } from 'playwright-core'
import {
  createHead,
  HeadClient,
  renderHeadToString,
  useHead,
  Head,
} from '../src'

type TestContext = {
  browser: ChromiumBrowser
}

const test = anyTest as TestInterface<TestContext>

test.before(async (t) => {
  t.context.browser = await chromium.launch({
    executablePath: require('chrome-location'),
  })
})

test.after(async (t) => {
  await t.context.browser.close()
})

test('server', async (t) => {
  const head = createHead()
  const app = createSSRApp({
    setup() {
      useHead({
        title: `hello`,
        htmlAttrs: {
          lang: 'zh',
        },
        meta: [
          {
            name: 'description',
            content: 'desc',
          },
          {
            name: 'description',
            content: 'desc 2',
          },
          {
            property: 'og:locale:alternate',
            content: 'fr',
            key: 'fr',
          },
          {
            property: 'og:locale:alternate',
            content: 'zh',
            key: 'zh',
          },
        ],
        script: [
          {
            src: 'foo.js',
          },
        ],
      })
      return () => <div>hi</div>
    },
  })
  app.use(head)
  await renderToString(app)

  const headResult = renderHeadToString(head)
  t.is(
    headResult.headTags,
    `<title>hello</title><meta name="description" content="desc 2"><meta property="og:locale:alternate" content="fr"><meta property="og:locale:alternate" content="zh"><script src="foo.js"></script><meta name="head:count" content="4">`,
  )
  t.is(headResult.htmlAttrs, ` lang="zh" data-head-attrs="lang"`)
})

test('browser', async (t) => {
  const page = await t.context.browser.newPage()
  await page.goto(`http://localhost:3000`)
  const headHTML = await page.evaluate(() => document.head.innerHTML)

  t.is(
    headHTML,
    `
    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>count: 0</title>
    <base href="/"><style>body {background: red}</style><meta name="description" content="desc 2"><meta property="og:locale:alternate" content="fr"><meta property="og:locale:alternate" content="zh"><meta name="head:count" content="5">`,
  )

  await page.click('button.counter')
  t.is(await page.title(), 'count: 1')

  await page.click('button.change-home-title')
  t.is(await page.title(), 'count: 1')

  await page.click('a[href="/about"]')
  t.is(await page.title(), 'About')
})

test('useHead: server async setup', async (t) => {
  const head = createHead()
  const app = createSSRApp({
    async setup() {
      const title = ref(`initial title`)
      useHead({ title })
      await new Promise((resolve) => setTimeout(resolve, 200))
      title.value = 'new title'
      return () => <div>hi</div>
    },
  })
  app.use(head)
  await renderToString(app)

  const { headTags } = renderHeadToString(head)
  t.regex(headTags, /new title/)
})

test('<Head>: basic', async (t) => {
  const page = await t.context.browser.newPage()
  await page.goto(`http://localhost:3000/contact`)
  const getHeadTags = async () => {
    const head: HeadClient = await page.evaluate(() => {
      // @ts-expect-error
      return window.head
    })
    return head.headTags
  }
  t.snapshot(await getHeadTags())
  await page.click('button')
  t.snapshot(await getHeadTags())
})

test('<Head>: server async setup', async (t) => {
  const head = createHead()
  const app = createSSRApp({
    async setup() {
      const title = ref(`initial title`)
      await new Promise((resolve) => setTimeout(resolve, 200))
      title.value = 'new title'
      return () => <Head>{() => <title>{title.value}</title>}</Head>
    },
  })
  app.use(head)
  await renderToString(app)

  const { headTags } = renderHeadToString(head)
  t.regex(headTags, /new title/)
})

test('children', async (t) => {
  const head = createHead()
  const app = createSSRApp({
    setup() {
      useHead({
        script: [
          {
            children: `console.log('hi')`,
          },
        ],
      })
      return () => <div>hi</div>
    },
  })
  app.use(head)
  await renderToString(app)

  const headResult = renderHeadToString(head)
  t.is(
    headResult.headTags,
    `<script>console.log('hi')</script><meta name="head:count" content="1">`,
  )
})

test('script key', async (t) => {
  const head = createHead()
  const app = createSSRApp({
    setup() {
      useHead({
        script: [
          {
            key: 'my-script',
            children: `console.log('A')`,
          },
          {
            key: 'my-script',
            children: `console.log('B')`,
          },
        ],
      })
      return () => <div>hi</div>
    },
  })
  app.use(head)
  await renderToString(app)

  const headResult = renderHeadToString(head)
  t.is(
    headResult.headTags,
    `<script>console.log('B')</script><meta name="head:count" content="1">`,
  )
})
