import { fileURLToPath } from 'node:url'
import { createPage, setup } from '@nuxt/test-utils'
import type { Page } from 'playwright'
import { expectNoClientErrors } from './utils'

await setup({
  rootDir: fileURLToPath(new URL('../../../examples/nuxt3', import.meta.url)),
  server: true,
  browser: true,
})

export async function queryHeadState(page: Page) {
  const htmlAttrs = await page.evaluate('[...document.children[0].attributes].map(f => ({ name: f.name, value: f.value }))')
  const bodyAttrs = await page.evaluate('[...document.querySelector(\'body\').attributes].map(f => ({ name: f.name, value: f.value }))')
  const title = await page.title()
  const $headCount = await page.evaluate('document.querySelector(\'meta[name="head:count"]\')')
  let headTagCount = 0
  let headTagIdx = 0
  if ($headCount) {
    headTagCount = Number.parseInt(await page.evaluate('document.querySelector(\'meta[name="head:count"]\')?.getAttribute(\'content\')'))
    headTagIdx = Number.parseInt(await page.evaluate('[...document.head.children].indexOf(document.querySelector(\'meta[name="head:count"]\'))')) - 1
  }
  const bodyTags = await page.evaluate('document.querySelectorAll(\'[data-meta-body]\')')
  let headTags = await page.evaluate('[...document.head.querySelectorAll(\'meta, script, link, noscript, style\').entries()].map(([k, v]) => v.outerHTML)')

  // only the x before the head tag count
  headTags = Object.entries(headTags).map(([key, value]) => {
    const idx = Number.parseInt(key)
    if (idx >= headTagIdx - headTagCount && idx < headTagIdx)
      return value
    return false
  }).filter(Boolean)

  return {
    headTagCount,
    title,
    headTags,
    bodyTags,
    htmlAttrs,
    bodyAttrs,
  }
}

describe('e2e: nuxt 3', () => {
  it('basic', async () => {
    const page = await createPage('/', { })

    await page.waitForTimeout(1000)

    const ctx = await queryHeadState(page)

    expect(ctx).toMatchInlineSnapshot(`
      {
        "bodyAttrs": [],
        "bodyTags": {},
        "headTagCount": 0,
        "headTags": [],
        "htmlAttrs": [],
        "title": "Hello world: 3.2.44 | Title Site",
      }
    `)
    await expectNoClientErrors('/')
  })
})
