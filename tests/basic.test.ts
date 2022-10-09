import { ref } from 'vue'
import { createHead } from '../src'

describe('basic', () => {
  test('removing head works', async () => {
    const head = createHead()
    head.setupHeadEntry({
      resolvedInput: {
        title: 'old',
        link: [
          {
            href: '/',
          },
        ],
      },
    })

    const { remove } = head.setupHeadEntry({
      resolvedInput: {
        title: 'test',
      },
    })
    remove()

    expect(head.headTags).toMatchInlineSnapshot(`
      [
        {
          "_options": {},
          "_position": 0,
          "props": {
            "textContent": "old",
          },
          "tag": "title",
        },
        {
          "_options": {},
          "_position": 1,
          "props": {
            "href": "/",
          },
          "tag": "link",
        },
      ]
    `)
  })

  test('computed getter', async () => {
    const colour = ref('yellow')
    const head = createHead()
    head.setupReactiveHeadEntry(
      () => ({
        bodyAttrs: {
          style: () => `background: ${colour.value}`,
          class: () => `bg-${colour.value}-500`,
        },
      }),
    )
    expect(head.headTags).toMatchInlineSnapshot(`
        [
          {
            "_options": {},
            "_position": 0,
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
