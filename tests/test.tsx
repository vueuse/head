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
  t.snapshot(headResult.headTags)
  t.is(headResult.htmlAttrs, ` lang="zh" data-head-attrs="lang"`)
})

test('browser', async (t) => {
  const page = await t.context.browser.newPage()
  await page.goto(`http://localhost:3000`)
  const headHTML = await page.evaluate(() => document.head.innerHTML)

  t.snapshot(headHTML)

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

test('<Head>: link & meta with v-for', async (t) => {
  const head = createHead()
  const app = createSSRApp({
    template: `<Head>
      <meta v-for="meta in metaList" :key="meta.property" :property="meta.property" :content="meta.content" />
    </Head>`,
    components: { Head },
    data() {
      return {
        metaList: [{ property: "test1", content: "test1" }, { property: "test2", content: "test2" }],
      };
    },
  })
  app.use(head)
  await renderToString(app)

  const { headTags } = renderHeadToString(head)
  t.snapshot(headTags);
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
