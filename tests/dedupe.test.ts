import { renderSSRHead } from '@unhead/ssr'
import { createHead } from '../src'

describe('dedupe', () => {
  it('dedupes desc', async () => {
    const head = createHead()
    head.push({
      meta: [
        {
          name: 'something-else',
          content: 'test',
        },
        {
          name: 'description',
          content: 'desc',
        },
      ],
    },
    )
    head.push({
      meta: [
        {
          name: 'description',
          content: 'desc 2',
        },
      ],
    },
    )
    const { headTags } = await renderSSRHead(head)
    expect(
      headTags.includes('<meta name="description" content="desc 2"'),
    ).toBeTruthy()
    expect(headTags.split('description').length === 2).toBeTruthy()
  })

  it('dedupes key', async () => {
    const head = createHead()
    head.push({
      meta: [
        {
          myCustomMeta: 'first',
          key: 'custom',
        },
      ],
    },
    )
    head.push({
      meta: [
        {
          myCustomMeta: 'second',
          key: 'custom',
        },
      ],
    },
    )
    const { headTags } = await renderSSRHead(head)
    expect(headTags.startsWith('<meta myCustomMeta="second"')).toBeTruthy()
    expect(headTags.split('myCustomMeta').length === 2).toBeTruthy()
  })

  test('dedupes canonical', async () => {
    const head = createHead()
    head.push({
      link: [
        {
          rel: 'canonical',
          href: 'https://website.com',
        },
      ],
    },
    )
    head.push({
      link: [
        {
          rel: 'canonical',
          href: 'https://website.com/new',
        },
      ],
    },
    )
    const { headTags } = await renderSSRHead(head)
    expect(
      headTags.startsWith(
        '<link rel="canonical" href="https://website.com/new"',
      ),
    ).toBeTruthy()
    expect(headTags.split('canonical').length === 2).toBeTruthy()
  })

  test('dedupes charset', async () => {
    const head = createHead()
    head.push(
      {
        meta: [
          {
            charset: 'utf-8-overridden',
          },
        ],
      },
    )
    head.push({
      meta: [
        {
          charset: 'utf-8',
        },
      ],
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags.startsWith('<meta charset="utf-8"')).toBeTruthy()
    expect(headTags.split('charset').length === 2).toBeTruthy()
  })

  test('dedupes base', async () => {
    const head = createHead()
    head.push({
      base: {
        href: '/old',
        target: '_blank',
      },
    })
    head.push({
      base: {
        href: '/',
      },
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags.split('base').length === 2).toBeTruthy()
    expect(headTags.startsWith('<base href="/"')).toBeTruthy()
  })

  test('dedupes http-equiv', async () => {
    const head = createHead()
    head.push({
      meta: [
        {
          'http-equiv': 'content-security-policy',
          'content': 'default-src https',
        },
      ],
    })
    head.push({
      meta: [
        {
          'http-equiv': 'content-security-policy',
          'content':
              'default-src https: \'unsafe-eval\' \'unsafe-inline\'; object-src \'none\'',
        },
      ],
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags.split('http-equiv').length === 2).toBeTruthy()
  })

  test('issue #104', async () => {
    const head = createHead()
    head.push({
      link: [
        { rel: 'icon', href: '/favicon.ico' }, // <-- this and,
        { rel: 'canonical', href: 'https://mydomain.me' }, // <-- this. Please reverse the order to be sure.
      ],
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags).toMatchInlineSnapshot(
      `
      "<link rel=\\"icon\\" href=\\"/favicon.ico\\">
      <link rel=\\"canonical\\" href=\\"https://mydomain.me\\">"
    `,
    )
  })

  test('doesn\'t dedupe over tag types', async () => {
    const head = createHead()
    head.push({
      meta: [
        {
          key: 'icon',
          name: 'description',
          content: 'test',
        },
      ],
      link: [{ rel: 'icon', href: '/favicon.ico', key: 'icon' }],
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags).toMatchInlineSnapshot(
      `
      "<meta name=\\"description\\" content=\\"test\\">
      <link rel=\\"icon\\" href=\\"/favicon.ico\\">"
    `,
    )
  })

  test('dedupes legacy', async () => {
    const head = createHead()
    head.push({
      meta: [
        {
          'unknown-key': 'description',
          'vmid': 'desc-1',
          'content': 'test',
        },
      ],
    })
    head.push({
      meta: [
        {
          'unknown-key': 'description',
          'vmid': 'desc-2',
          'content': 'test 2',
        },
      ],
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags).toMatchInlineSnapshot(
      `
      "<meta unknown-key=\\"description\\" content=\\"test\\">
      <meta unknown-key=\\"description\\" content=\\"test 2\\">"
    `,
    )
  })
})
