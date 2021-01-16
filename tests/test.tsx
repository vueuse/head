import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { chromium, ChromiumBrowser } from 'playwright-chromium'
import { createHead, renderHeadToString, useHead } from '../src'

type Context = {
  browser: ChromiumBrowser
}

const test = suite<Context>()

test.before(async (context) => {
  context.browser = await chromium.launch()
})

test.after(async (context) => {
  await context.browser.close()
})

test('server', async () => {
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
      }))
      return () => <div>hi</div>
    },
  })
  app.use(head)
  await renderToString(app)

  const headResult = renderHeadToString(head)
  assert.is(
    headResult.headTags,
    `<title>hello</title><meta name="description" content="desc 2"/><meta property="og:locale:alternate" content="fr"/><meta property="og:locale:alternate" content="zh"/><meta name="head:count" content="3" />`,
  )
  assert.is(headResult.htmlAttrs, ` lang="zh" data-head-attrs="lang"`)
})

test('browser', async (context) => {
  const page = await context.browser.newPage()
  await page.goto(`http://localhost:3000`)
  const headHTML = await page.evaluate(() => document.head.innerHTML)

  assert.is(
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
  assert.is(await page.title(), 'count: 1')

  await page.click('a[href="/about"]')
  assert.is(await page.title(), 'About')
})

test.run()
