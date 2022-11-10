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
        <base href=\\"/\\" data-h-6ac180=\\"\\"><meta name=\\"custom-priority\\" content=\\"of 1\\" data-h-16074c=\\"\\"><meta name=\\"global-meta\\" content=\\"some global meta tag\\" data-h-91ec2a=\\"\\"><style data-h-00f21a=\\"\\">body {background: salmon}</style><noscript data-h-7d4fba=\\"\\">This app requires javascript to work</noscript><meta name=\\"description\\" content=\\"desc\\" data-h-889faf=\\"\\"><meta name=\\"description\\" content=\\"desc 2\\" data-h-889faf518=\\"\\"><meta property=\\"og:locale:alternate\\" content=\\"fr\\" data-h-3f7248=\\"\\"><meta property=\\"og:locale:alternate\\" content=\\"zh\\" data-h-321fb4=\\"\\"><link href=\\"/foo\\" rel=\\"stylesheet\\" data-h-684cf5=\\"\\"><script data-h-1b64e8=\\"\\">console.log(\\"counter mount\\")</script>"
    `)

    await page.click('button.counter')
    expect(await page.title()).equals('count: 1 | @vueuse/head')

    await page.click('button.change-home-title')
    expect(await page.title()).equals('count: 1 | @vueuse/head')

    await page.click('a[href="/about"]')
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

    const script = await page.$('[data-h-a77042]')
    const scriptHtml = await script.innerHTML()
    expect(scriptHtml).equals('console.log(\'home mount\')')
  })
})
