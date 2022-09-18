import { HeadClient } from "../../../src"
import { createBrowser, startServer } from "./utils"
import { ExecaChildProcess } from "execa"
import { Browser } from "playwright"

describe("e2e: vite ssr", async () => {
  let serverProcess: ExecaChildProcess
  let browser: Browser
  let url: string

  beforeAll(async () => {
    const serverCtx = await startServer()
    serverProcess = serverCtx.serverProcess
    url = serverCtx.url
    browser = await createBrowser()
  }, 60000)

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill()
    }
  })

  test("browser", async () => {
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle" })
    const headHTML = await page.evaluate(() => document.head.innerHTML)

    expect(headHTML).toMatchInlineSnapshot(`
      "
          <script type=\\"module\\" src=\\"/@vite/client\\"></script>

          <meta charset=\\"UTF-8\\">
          <meta http-equiv=\\"X-UA-Compatible\\" content=\\"IE=edge\\">
          <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\">
          <title>count: 0 | @vueuse/head</title>
        <meta name=\\"global-meta\\" content=\\"some global meta tag\\"><base href=\\"/\\"><meta name=\\"custom-priority\\" content=\\"of 1\\"><meta name=\\"description\\" content=\\"desc 2\\"><meta property=\\"og:locale:alternate\\" content=\\"fr\\"><meta property=\\"og:locale:alternate\\" content=\\"zh\\"><style>body {background: salmon}</style><noscript>This app requires javascript to work</noscript><script>console.log(\\"a\\")</script><link href=\\"/foo\\" rel=\\"stylesheet\\"><meta name=\\"head:count\\" content=\\"10\\">"
    `)

    await page.click("button.counter")
    expect(await page.title()).equals("count: 1 | @vueuse/head")

    await page.click("button.change-home-title")
    expect(await page.title()).equals("count: 1 | @vueuse/head")

    await page.click('a[href="/about"]')
    expect(await page.title()).equals("About | About Template")
  })

  test("<Head>: basic", async () => {
    const page = await browser.newPage()
    await page.goto(`${url}/contact`, { waitUntil: "networkidle" })
    const getHeadTags = async () => {
      const head: HeadClient = await page.evaluate(() => {
        // @ts-expect-error
        return window.head
      })
      return head.headTags
    }
    expect((await getHeadTags()).find(t => t.tag === 'title')!.props.children)
      .toMatchInlineSnapshot('"0 | @vueuse/head"')
    await page.click("button")
    expect((await getHeadTags()).find(t => t.tag === 'title')!.props.children)
      .toMatchInlineSnapshot('"1 | @vueuse/head"')
  })

  test("body script", async () => {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: "networkidle" })

    const script = await page.$("[data-meta-body]")
    const scriptHtml = await script.innerHTML()
    expect(scriptHtml).equals(`console.log('hi')`)
  })
})
