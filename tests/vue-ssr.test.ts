import { createSSRApp, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { Head, createHead, renderHeadToString, useHead } from '../src'
import { ssrRenderHeadToString } from './shared/utils'

describe('vue ssr', () => {
  test('server', async () => {
    const headResult = await ssrRenderHeadToString(() => useHead({
      title: 'hello',
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
      script: [
        {
          src: 'foo.js',
        },
      ],
    }))

    expect(headResult.headTags).toMatchInlineSnapshot(
      `
      "<title>hello</title>
      <meta name=\\"description\\" content=\\"desc\\" data-h-889faf=\\"\\">
      <meta name=\\"description\\" content=\\"desc 2\\" data-h-889faf3=\\"\\">
      <meta property=\\"og:locale:alternate\\" content=\\"fr\\" data-h-3f7248=\\"\\">
      <meta property=\\"og:locale:alternate\\" content=\\"zh\\" data-h-321fb4=\\"\\">
      <script src=\\"foo.js\\" data-h-ed7ece=\\"\\"></script>"
    `,
    )
    expect(headResult.htmlAttrs).toEqual(' lang="zh"')
  })

  test('useHead: server async setup', async () => {
    const head = createHead()
    const app = createSSRApp({
      async setup() {
        const title = ref('initial title')
        useHead({
          title,
        })
        await new Promise(resolve => setTimeout(resolve, 200))
        title.value = 'new title'
        return () => '<div>hi</div>'
      },
    })
    app.use(head)
    await renderToString(app)

    const { headTags } = await renderHeadToString(head)
    expect(headTags).match(/new title/)
  })

  test('<Head>: link & meta with v-for', async () => {
    const head = createHead()
    const app = createSSRApp({
      template: `<Head>
      <meta v-for="meta in metaList" :key="meta.property" :property="meta.property" :content="meta.content" />
      </Head>`,
      components: { Head },
      data() {
        return {
          metaList: [
            { property: 'test1', content: 'test1' },
            { property: 'test2', content: 'test2' },
          ],
        }
      },
    })
    app.use(head)
    await renderToString(app)

    const { headTags } = await renderHeadToString(head)
    expect(headTags).toMatchInlineSnapshot(
      `
      "<meta property=\\"test1\\" content=\\"test1\\" data-h-051b9d=\\"\\">
      <meta property=\\"test2\\" content=\\"test2\\" data-h-7449ef=\\"\\">"
    `,
    )
  })

  test('children', async () => {
    const headResult = await ssrRenderHeadToString(() => {
      useHead({
        script: [
          {
            innerHTML: 'console.log(\'hi\')',
          },
        ],
      })
    })

    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<script data-h-2abb7d=\\"\\">console.log(\'hi\')</script>"',
    )
  })

  test('script key', async () => {
    const headResult = await ssrRenderHeadToString(() =>
      useHead({
        script: [
          {
            src: 'test',
            key: 'my-script',
            innerHTML: 'console.log(\'A\')',
          },
          {
            key: 'my-script',
            innerHTML: 'console.log(\'B\')',
          },
        ],
      }),
    )

    expect(headResult.headTags).toMatchInlineSnapshot(
      `
      "<script src=\\"test\\" data-h-229264=\\"\\">console.log('A')</script>
      <script data-h-2292641=\\"\\">console.log('B')</script>"
    `,
    )
  })

  test('#issue 138', async () => {
    const headResult = await ssrRenderHeadToString(() =>
      useHead({
        link: [
          {
            href: '/',
          },
          ...[].map(() => ({
            rel: 'prefetch',
            href: '',
          })), // this damages the type inference
          { rel: 'icon', type: 'image/svg', href: '/favicon.svg' },
        ],
      }),
    )

    expect(headResult.headTags).toMatchInlineSnapshot(
      `
      "<link href=\\"/\\" data-h-877ffb=\\"\\">
      <link rel=\\"icon\\" type=\\"image/svg\\" href=\\"/favicon.svg\\" data-h-ce747c=\\"\\">"
    `,
    )
  })

  test('non-strings', async () => {
    const headResult = await ssrRenderHeadToString(() => useHead({
      htmlAttrs: {
        'data-something': true,
      },
    }))

    expect(headResult.htmlAttrs).toMatchInlineSnapshot(
      '" data-something=\\"\\""',
    )
  })
})
