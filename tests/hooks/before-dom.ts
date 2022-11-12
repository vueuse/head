import { createSSRApp, ref } from 'vue'
import { JSDOM } from 'jsdom'
import { renderToString } from '@vue/server-renderer'
import { createHead, useHead } from '../../src'

describe('toggle dom render', () => {
  test('basic', async () => {
    const head = createHead()
    head.push({
      title: 'test',
    })

    let pauseDOMUpdates = true
    head.hooks.hook('dom:beforeRender', (ctx) => {
      ctx.shouldRender = !pauseDOMUpdates
    })

    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body></body></html>',
    )

    await head.updateDOM(dom.window.document, true)

    expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot('""')

    pauseDOMUpdates = false

    await head.updateDOM(dom.window.document, true)

    expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot(
      '"<title>test</title>"',
    )
  })

  test('vue', async () => {
    const head = createHead()
    const app = createSSRApp({
      async setup() {
        let pauseDOMUpdates = true

        head.hooks.hook('dom:beforeRender', (ctx) => {
          ctx.shouldRender = !pauseDOMUpdates
        })
        const title = ref('')
        useHead({
          title,
        })
        const dom = new JSDOM(
          '<!DOCTYPE html><html><head></head><body></body></html>',
        )

        // needed to avoid the tick issuehead.updateDOM(dom.window.document, true)

        expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot('""')

        pauseDOMUpdates = false
        title.value = 'hello'

        await head.updateDOM(dom.window.document, true)

        expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot(
          '"<title>hello</title>"',
        )

        return () => '<div>hi</div>'
      },
    })
    app.use(head)
    await renderToString(app)
  })
})
