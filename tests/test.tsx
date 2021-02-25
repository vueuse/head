import anyTest, { TestInterface } from 'ava'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { chromium, ChromiumBrowser } from 'playwright-chromium'
import { createHead, renderHeadToString, useHead } from '../src'

type TestContext = {
  browser: ChromiumBrowser
}

const test = anyTest as TestInterface<TestContext>

test.before(async (t) => {
  t.context.browser = await chromium.launch()
})

test.after(async (t) => {
  await t.context.browser.close()
})

test('server', async (t) => {
  const head = createHead()
  const app = createSSRApp({
    setup() {
      useHead(() => ({
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
      }))
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

  await page.click('button')
  t.is(await page.title(), 'count: 1')

  await page.click('a[href="/about"]')
  t.is(await page.title(), 'About')
})
