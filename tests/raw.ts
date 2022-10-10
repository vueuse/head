import { createSSRApp, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createHead, renderHeadToString, useHeadRaw } from '../src'

describe('use head raw', () => {
  test('basic', async () => {
    const head = createHead()
    const app = createSSRApp({
      setup() {
        const title = ref('')
        useHeadRaw({
          htmlAttrs: {
            'aria-label': 'test',
            'onkeyup': 'alert(1)',
          },
          script: [
            {
              innerHTML: 'console.log(2)',
              autofocus: true,
            },
          ],
          noscript: [
            {
              innerHTML: '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
            },
          ],
        })
        title.value = 'hello'
        return () => '<div>hi</div>'
      },
    })
    app.use(head)
    await renderToString(app)

    const headResult = await renderHeadToString(head)
    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<script autofocus>console.log(2)</script><noscript><iframe src=\\"https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX\\" height=\\"0\\" width=\\"0\\" style=\\"display:none;visibility:hidden\\"></iframe></noscript><meta name=\\"head:count\\" content=\\"2\\">"',
    )
    expect(headResult.htmlAttrs).toMatchInlineSnapshot('" aria-label=\\"test\\" onkeyup=\\"alert(1)\\" data-head-attrs=\\"aria-label,onkeyup\\""')
  })
})
