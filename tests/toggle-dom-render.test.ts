import { computed, createSSRApp, ref } from "vue"
import { createHead, useHead, injectHead } from "../src"
import { JSDOM } from "jsdom"
import { renderToString } from "@vue/server-renderer"

describe("toggle dom render", () => {
  test("basic", async () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        title: "test",
      })),
    )

    head._pauseDOMUpdates.value = true

    const dom = new JSDOM(
      "<!DOCTYPE html><html><head></head><body></body></html>",
    )

    head.updateDOM(dom.window.document)

    expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot('""')

    head._pauseDOMUpdates.value = false

    head.updateDOM(dom.window.document)

    expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot(
      '"<title>test</title>"',
    )
  })

  test("vue", async () => {
    const head = createHead()
    const app = createSSRApp({
      setup() {
        const client = injectHead()
        client._pauseDOMUpdates.value = true
        const title = ref("")
        useHead({
          title,
        })
        const dom = new JSDOM(
          "<!DOCTYPE html><html><head></head><body></body></html>",
        )

        head.updateDOM(dom.window.document)

        expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot('""')

        client._pauseDOMUpdates.value = false
        title.value = "hello"

        head.updateDOM(dom.window.document)

        expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot(
          '"<title>hello</title>"',
        )

        return () => "<div>hi</div>"
      },
    })
    app.use(head)
    await renderToString(app)
  })
})
