import { computed, createSSRApp, ref } from 'vue'
import { JSDOM } from 'jsdom'
import { renderToString } from '@vue/server-renderer'
import { createHead, useHead } from '../src'

describe('toggle dom render', () => {
  test('basic', async () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        title: 'test',
      })),
    )

    let pauseDOMUpdates = true
    head.hookBeforeDomUpdate.push(() => !pauseDOMUpdates)

    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body></body></html>',
    )

    head.updateDOM(dom.window.document)

    expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot('""')

    pauseDOMUpdates = false

    head.updateDOM(dom.window.document)

    expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot(
      '"<title>test</title>"',
    )
  })

  test('vue', async () => {
    const head = createHead()
    const app = createSSRApp({
      setup() {
        let pauseDOMUpdates = true
        head.hookBeforeDomUpdate.push(() => !pauseDOMUpdates)
        const title = ref('')
        useHead({
          title,
        })
        const dom = new JSDOM(
          '<!DOCTYPE html><html><head></head><body></body></html>',
        )

        head.updateDOM(dom.window.document)

        expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot('""')

        pauseDOMUpdates = false
        title.value = 'hello'

        head.updateDOM(dom.window.document)

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
