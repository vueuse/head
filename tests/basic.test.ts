import { createHead } from '../src'

describe('basic', () => {
  test('removing head works', async () => {
    const head = createHead()
    head.addHeadObjs(
      () => ({
        title: 'old',
        link: [
          {
            href: '/',
          },
        ],
      }),
    )
    const rm = head.addHeadObjs(
      () => ({
        title: 'test',
      }),
    )
    rm()

    expect(head.headTags).toMatchInlineSnapshot(`
      [
        {
          "_position": 0,
          "props": {
            "textContent": "old",
          },
          "tag": "title",
        },
        {
          "_position": 1,
          "props": {
            "href": "/",
          },
          "tag": "link",
        },
      ]
    `)
  })
})
