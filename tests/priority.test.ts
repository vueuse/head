import { createHead, renderHeadToString } from '../src'

describe('tag priority', () => {
  test('charset first', async () => {
    const head = createHead()
    head.push({
      script: [
        {
          src: '/my-important-script.js',
        },
      ],
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
    })
    head.push({
      meta: [
        {
          charset: 'utf-8',
        },
      ],
    })
    const { headTags } = await renderHeadToString(head)
    expect(headTags.startsWith('<meta charset="utf-8"')).toBeTruthy()
  })

  test('base early', async () => {
    const head = createHead()
    head.push({
      script: [
        {
          src: '/my-important-script.js',
        },
      ],
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
    })
    head.push({
      meta: [
        {
          charset: 'utf-8',
        },
      ],
      base: {
        href: '/base',
      },
    })
    const { headTags } = await renderHeadToString(head)
    expect(
      headTags.startsWith('<meta charset="utf-8"'),
    ).toBeTruthy()
  })

  test('CSP early', async () => {
    const head = createHead()
    head.push({
      script: [
        {
          src: '/my-important-script.js',
        },
      ],
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
    })
    head.push({
      meta: [
        {
          'http-equiv': 'content-security-policy',
          'content': 'test',
        },
      ],
    })
    const { headTags } = await renderHeadToString(head)
    expect(
      headTags.startsWith(
        '<meta http-equiv="content-security-policy" content="test"',
      ),
    ).toBeTruthy()
  })

  test('manual priority', async () => {
    const head = createHead()
    head.push({
      script: [
        {
          src: '/not-important-script.js',
        },
      ],
    })
    head.push({
      script: [
        {
          src: '/very-important-script.js',
          tagPriority: 1,
        },
      ],
    })
    const { headTags } = await renderHeadToString(head)
    expect(headTags).toMatchInlineSnapshot(`
      "<script src=\\"/very-important-script.js\\" data-h-420dfb=\\"\\"></script>
      <script src=\\"/not-important-script.js\\" data-h-a4dbdb=\\"\\"></script>"
    `)
    expect(
      headTags.startsWith('<script src="/very-important-script.js"'),
    ).toBeTruthy()
  })
})
