import type { ExecaChildProcess } from 'execa'
import type { Browser } from 'playwright'
import { createBrowser, startServer } from './utils'
import {HeadTag} from "@unhead/vue";

describe('e2e: vite ssr', async () => {
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
    if (serverProcess)
      serverProcess.kill()
  })

  test('browser', async () => {
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: 'networkidle' })
    const headHTML = await page.evaluate(() => document.head.innerHTML)

    expect(headHTML).toMatchInlineSnapshot(`
      "
          <script type=\\"module\\" src=\\"/@vite/client\\"></script>

          <meta charset=\\"UTF-8\\">
          <meta http-equiv=\\"X-UA-Compatible\\" content=\\"IE=edge\\">
          <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\">
          <title>count: 0 | @vueuse/head</title>
        <base href=\\"/\\"><meta name=\\"custom-priority\\" content=\\"of 1\\"><meta name=\\"global-meta\\" content=\\"some global meta tag\\"><style>body {background: salmon}</style><noscript>This app requires javascript to work</noscript><meta name=\\"description\\" content=\\"desc\\"><meta name=\\"description\\" content=\\"desc 2\\"><meta property=\\"og:locale:alternate\\" content=\\"fr\\"><meta property=\\"og:locale:alternate\\" content=\\"zh\\"><link href=\\"/foo\\" rel=\\"stylesheet\\"><script>console.log(\\"counter mount\\")</script>"
    `)

    await page.click('button.counter')

    await page.waitForTimeout(500)

    expect(await page.title()).equals('count: 1 | @vueuse/head')

    await page.click('button.change-home-title')
    expect(await page.title()).equals('count: 1 | @vueuse/head')

    await page.click('a[href="/about"]')

    await page.waitForTimeout(500)

    expect(await page.title()).equals('About | About Template')
  })

  test('<Head>: basic', async () => {
    const page = await browser.newPage()
    await page.goto(`${url}/contact`, { waitUntil: 'networkidle' })

    const getHeadTags = async () => {
      return await page.evaluate(async () => {
        // @ts-expect-error untyped
        return await window.head.resolveTags()
      })
    }
    let tags = await getHeadTags() as HeadTag[]
    expect(
      tags.find(t => t.tag === 'title')!.children,
    ).toMatchInlineSnapshot('"0 | @vueuse/head"')
    await page.click('button')
    tags = await getHeadTags()
    expect(
      tags.find(t => t.tag === 'title')!.children,
    ).toMatchInlineSnapshot('"1 | @vueuse/head"')
  })

  test('body script', async () => {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle' })

    const script = await page.$('[data-home-mount]')
    const scriptHtml = await script.innerHTML()
    expect(scriptHtml).equals('console.log(\'home mount\')')
  })
})
