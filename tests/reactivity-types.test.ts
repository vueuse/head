import { computed, createSSRApp, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import type { UseHeadInput } from '@vueuse/head'
import type { HeadObjectPlain } from '../src'
import { createHead, renderHeadToString, useHead } from '../src'
import { ssrRenderHeadToString } from './shared/utils'

describe('reactivity', () => {
  test('basic', async () => {
    const titleTemplate = ref('%s - My site')

    const headResult = await ssrRenderHeadToString(() => useHead({
      title: 'hello',
      titleTemplate,
      htmlAttrs: {
        lang: ref('zh'),
      },
      bodyAttrs: {
        'data-some-body-attr': 'some-value',
      },
      meta: [
        {
          name: 'description',
          content: ref('test'),
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
      link: [
        {
          as: 'style',
          href: '/style.css',
        },
      ],
      style: [
        {
          children: '* { color: red }',
          body: true,
        },
      ],
      script: [
        {
          key: 'foo-script',
          src: 'foo.js',
        },
      ],
    }))

    expect(headResult).toMatchInlineSnapshot(`
      {
        "bodyAttrs": " data-some-body-attr=\\"some-value\\"",
        "bodyTags": "<style data-h-5845cb=\\"\\">* { color: red }</style>",
        "bodyTagsOpen": "",
        "headTags": "<title>hello - My site</title>
      <meta name=\\"description\\" content=\\"test\\" data-h-889faf=\\"\\">
      <meta name=\\"description\\" content=\\"desc 2\\" data-h-889faf5=\\"\\">
      <meta property=\\"og:locale:alternate\\" content=\\"fr\\" data-h-3f7248=\\"\\">
      <meta property=\\"og:locale:alternate\\" content=\\"zh\\" data-h-321fb4=\\"\\">
      <link as=\\"style\\" href=\\"/style.css\\" data-h-230b58=\\"\\">
      <script src=\\"foo.js\\" data-h-d66090=\\"\\"></script>",
        "htmlAttrs": " lang=\\"zh\\"",
      }
    `)
    expect(headResult.htmlAttrs).toEqual(' lang="zh"')
  })

  test('computed', async () => {
    const head = createHead()
    const app = createSSRApp({
      setup() {
        const title = ref('')
        useHead({
          title: title.value,
        })
        title.value = 'hello'
        return () => '<div>hi</div>'
      },
    })
    app.use(head)
    await renderToString(app)

    const headResult = await renderHeadToString(head)
    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<title></title>"',
    )
  })

  test('reactive', async () => {
    const head = createHead()
    const app = createSSRApp({
      setup() {
        const title = ref('')
        const scripts = ref<Required<HeadObjectPlain>['script']>([])
        const urlMeta = computed<Required<HeadObjectPlain>['meta'][number]>(
          () => {
            return {
              property: 'og:url',
              content: 'test',
            }
          },
        )
        useHead({
          title,
          htmlAttrs: {
            lang: 'test',
            dir: 'ltr',
          },
          meta: [
            {
              'name': 'description',
              'content': () => `${title.value} this is my description`,
              'data-unknown-attr': 'test',
            },
            {
              property: 'og:fake-prop',
              content: 'test',
            },
            {
              name: 'fake-name-prop',
              content: 'test',
            },
            urlMeta,
          ],
          script: scripts,
        })
        scripts.value.push({
          src: 'foo.js',
        })
        title.value = 'hello'
        return () => '<div>hi</div>'
      },
    })
    app.use(head)
    await renderToString(app)

    const headResult = await renderHeadToString(head)
    expect(headResult.headTags).toMatchInlineSnapshot(
      `
      "<title>hello</title>
      <meta name=\\"description\\" content=\\"hello this is my description\\" data-unknown-attr=\\"test\\" data-h-889faf=\\"\\">
      <meta property=\\"og:fake-prop\\" content=\\"test\\" data-h-38add9=\\"\\">
      <meta name=\\"fake-name-prop\\" content=\\"test\\" data-h-624d02=\\"\\">
      <meta property=\\"og:url\\" content=\\"test\\" data-h-79e151=\\"\\">
      <script src=\\"foo.js\\" data-h-ed7ece=\\"\\"></script>"
    `,
    )
  })

  test('computed getter entry', async () => {
    const headResult = await ssrRenderHeadToString(() => useHead(() => ({
      title: 'test',
    })))
    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<title>test</title>"',
    )
  })

  test('computed getter entries', async () => {
    const test = ref('test')
    const input: UseHeadInput = {
      title: () => 'my title',
      script: () => {
        return [
          {
            src: 'foo.js',
          },
        ]
      },
      meta: [
        () => ({
          name: test.value,
          content: test.value,
        }),
        {
          name: () => `some-flag-${test.value}`,
          content: 'test',
        },
        {
          property: 'og:fake-prop',
          content: () => test.value,
        },
      ],
    }
    const headResult = await ssrRenderHeadToString(() => useHead(input))
    expect(headResult.headTags).toMatchInlineSnapshot(
      `
      "<title>my title</title>
      <script src=\\"foo.js\\" data-h-ed7ece=\\"\\"></script>
      <meta name=\\"test\\" content=\\"test\\" data-h-d5992c=\\"\\">
      <meta name=\\"some-flag-test\\" content=\\"test\\" data-h-40328b=\\"\\">
      <meta property=\\"og:fake-prop\\" content=\\"test\\" data-h-38add9=\\"\\">"
    `,
    )
    test.value = 'test2'
    const headResult2 = await ssrRenderHeadToString(() => useHead(input))
    expect(headResult2.headTags).toMatchInlineSnapshot(
      `
      "<title>my title</title>
      <script src=\\"foo.js\\" data-h-ed7ece=\\"\\"></script>
      <meta name=\\"test2\\" content=\\"test2\\" data-h-836155=\\"\\">
      <meta name=\\"some-flag-test2\\" content=\\"test\\" data-h-6682bb=\\"\\">
      <meta property=\\"og:fake-prop\\" content=\\"test2\\" data-h-38add9=\\"\\">"
    `,
    )
  })

  test('malformed', async () => {
    const headResult = await ssrRenderHeadToString(() =>
      useHead({
        title() {
          return 'my title'
        },
        meta: [
          {
            // @ts-expect-error number is not valid for name
            'name': 123,
            'data-unknown-attr': 'test',
            // @ts-expect-error meta cannot have children
            'children': 'test',
          },
          {
            name: 'some-flag',
            content: true,
          },
          {
            property: 'og:fake-prop',
            content: ['test1', 'test2'],
          },
        ],
      },
      ))
    expect(headResult.headTags).toMatchInlineSnapshot(
      `
      "<title>my title</title>
      <meta name=\\"123\\" data-unknown-attr=\\"test\\" data-h-24abca=\\"\\">
      <meta name=\\"some-flag\\" content=\\"\\" data-h-6a4798=\\"\\">
      <meta property=\\"og:fake-prop\\" content=\\"test1\\" data-h-28f8b0=\\"\\">
      <meta property=\\"og:fake-prop\\" content=\\"test2\\" data-h-b8eef8=\\"\\">"
    `,
    )
  })
})
