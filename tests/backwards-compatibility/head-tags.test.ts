import { createHead } from '../../src'

describe('head tags', () => {
  test('calling them works', async () => {
    const head = createHead()
    head.addEntry({
      title: 'test',
      link: [
        {
          href: '/',
        },
      ],
    })

    expect(head.headTags).toMatchInlineSnapshot(`
      [
        {
          "children": "test",
          "options": {},
          "props": {},
          "runtime": {
            "entryId": 0,
            "position": 0,
          },
          "tag": "title",
        },
        {
          "options": {},
          "props": {
            "href": "/",
          },
          "runtime": {
            "entryId": 0,
            "position": 1,
          },
          "tag": "link",
        },
      ]
    `)
  })
})
