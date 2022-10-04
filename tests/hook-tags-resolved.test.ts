import { computed } from 'vue'
import { JSDOM } from 'jsdom'
import { createHead } from '../src'

describe('hook tags resolved', () => {
  test('read tags', async () => {
    const head = createHead()

    const hookTags = new Promise((resolve) => {
      head.hookTagsResolved.push((tags) => {
        resolve(tags)
      })
    })

    head.addHeadObjs(
      computed(() => ({
        title: 'test',
      })),
    )
    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body></body></html>',
    )
    head.updateDOM(dom.window.document)

    const tags = await hookTags
    expect(tags[0].tag).toEqual('title')
    expect(tags[0].props.textContent).toEqual('test')
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "_position": 0,
          "props": {
            "textContent": "test",
          },
          "tag": "title",
        },
      ]
    `)
  })

  test('write tags', async () => {
    const head = createHead()

    const hookTags = new Promise((resolve) => {
      head.hookTagsResolved.push((tags) => {
        for (const k in tags)
          tags[k].props.extra = true

        resolve(tags)
      })
    })

    head.addHeadObjs(
      computed(() => ({
        title: 'test',
      })),
    )
    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body></body></html>',
    )
    head.updateDOM(dom.window.document)

    const hooks = await hookTags
    expect(hooks[0].props.extra).toBeTruthy()
    expect(hooks[0]).toMatchInlineSnapshot(`
      {
        "_position": 0,
        "props": {
          "extra": true,
          "textContent": "test",
        },
        "tag": "title",
      }
    `)
  })
})
