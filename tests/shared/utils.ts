import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createHead, renderHeadToString } from '../../src'

export async function ssrRenderHeadToString(fn: () => void) {
  const head = createHead()
  const app = createSSRApp({
    setup() {
      fn()
      return () => '<div>hi</div>'
    },
  })
  app.use(head)
  await renderToString(app)

  return renderHeadToString(head)
}
