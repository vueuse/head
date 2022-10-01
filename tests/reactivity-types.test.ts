import { computed, createSSRApp, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createHead, renderHeadToString, useHead } from '../src'
import type { HeadObject, HeadObjectPlain } from '../src/types'
import { ssrRenderHeadToString } from './shared/utils'

describe('reactivity', () => {
  test('basic', async () => {
    const titleTemplate = ref('%s - My site')

    const headResult = await ssrRenderHeadToString({
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
    })

    expect(headResult).toMatchInlineSnapshot(`
      {
        "bodyAttrs": " data-some-body-attr=\\"some-value\\" data-head-attrs=\\"data-some-body-attr\\"",
        "bodyTags": "<style data-meta-body=\\"true\\">* { color: red }</style>",
        "headTags": "<title>hello - My site</title><meta name=\\"description\\" content=\\"desc 2\\"><meta property=\\"og:locale:alternate\\" content=\\"fr\\"><meta property=\\"og:locale:alternate\\" content=\\"zh\\"><link as=\\"style\\" href=\\"/style.css\\"><script src=\\"foo.js\\"></script><meta name=\\"head:count\\" content=\\"5\\">",
        "htmlAttrs": " lang=\\"zh\\" data-head-attrs=\\"lang\\"",
      }
    `)
    expect(headResult.htmlAttrs).toEqual(' lang="zh" data-head-attrs="lang"')
  })

  test('computed', async () => {
    const head = createHead()
    const app = createSSRApp({
      setup() {
        const title = ref('')
        useHead(
          computed<HeadObject>(() => {
            return {
              title: title.value,
            }
          }),
        )
        title.value = 'hello'
        return () => '<div>hi</div>'
      },
    })
    app.use(head)
    await renderToString(app)

    const headResult = renderHeadToString(head)
    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<title></title><meta name=\\"head:count\\" content=\\"0\\">"',
    )
  })

  test('reactive', async () => {
    const head = createHead()
    const app = createSSRApp({
      setup() {
        const title = ref('')
        const scripts = ref<Required<HeadObject>['script']>([])
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
              'content': computed(() => `${title.value} this is my description`),
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

    const headResult = renderHeadToString(head)
    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<title>hello</title><meta name=\\"description\\" content=\\" this is my description\\" data-unknown-attr=\\"test\\"><meta property=\\"og:fake-prop\\" content=\\"test\\"><meta name=\\"fake-name-prop\\" content=\\"test\\"><meta property=\\"og:url\\" content=\\"test\\"><script src=\\"foo.js\\"></script><meta name=\\"head:count\\" content=\\"5\\">"',
    )
  })

  test('malformed', async () => {
    const headResult = await ssrRenderHeadToString({
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
          // @ts-expect-error boolean is not valid for name
          content: true,
        },
        {
          property: 'og:fake-prop',
          // @ts-expect-error arrays not allowed
          content: ['test1', 'test2'],
        },
      ],
    })
    expect(headResult.headTags).toMatchInlineSnapshot(`
      "<title>title() {
              return \\"my title\\";
            }</title><meta name=\\"123\\" data-unknown-attr=\\"test\\"><meta name=\\"some-flag\\" content><meta property=\\"og:fake-prop\\" content=\\"test1,test2\\"><meta name=\\"head:count\\" content=\\"3\\">"
    `)
  })
})
