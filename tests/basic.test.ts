import { ref } from 'vue'
import { createHead } from '../src'

describe('basic', () => {
  test('removing head works', async () => {
    const head = createHead()
    head.push({
      title: 'old',
      link: [
        {
          href: '/',
        },
      ],
    })

    const { dispose } = head.push({
      title: 'test',
    })
    dispose()

    expect(head.headEntries().length).toBe(1)
    expect(head.headEntries()).toMatchInlineSnapshot(`
      [
        {
          "_i": 0,
          "_sde": {},
          "input": {
            "link": [
              {
                "href": "/",
              },
            ],
            "title": "old",
          },
        },
      ]
    `)
  })

  test('computed getter', async () => {
    const colour = ref('yellow')
    const head = createHead()
    head.push(
      () => ({
        bodyAttrs: {
          style: () => `background: ${colour.value}`,
          class: () => `bg-${colour.value}-500`,
        },
      }),
    )
    expect(head.headEntries()).toMatchInlineSnapshot(`
      [
        {
          "_i": 0,
          "_sde": {},
          "input": [Function],
        },
      ]
    `)

    expect(await head.resolveTags()).toMatchInlineSnapshot(`
      [
        {
          "_d": "bodyAttrs",
          "_e": 0,
          "_p": 0,
          "props": {
            "class": "bg-yellow-500",
            "style": "background: yellow",
          },
          "tag": "bodyAttrs",
        },
      ]
    `)
  })
})
