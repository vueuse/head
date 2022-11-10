import { createHead } from '../../src'

describe('head tags', () => {
  test('calling them works', async () => {
    const head = createHead()
    head.push({
      title: 'test',
      link: [
        {
          href: '/',
        },
      ],
    })

    expect(await head.headTags()).toMatchInlineSnapshot(`
      [
        {
          "_d": "title",
          "_e": 0,
          "_p": 0,
          "children": "test",
          "props": {},
          "tag": "title",
        },
        {
          "_e": 0,
          "_p": 1,
          "_s": "data-h-877ffb",
          "props": {
            "data-h-877ffb": "",
            "href": "/",
          },
          "tag": "link",
        },
      ]
    `)
  })
})
