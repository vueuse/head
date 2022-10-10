import { JSDOM } from 'jsdom'
import { createHead } from '../../src'

describe('hook tags resolved', () => {
  test('read tags', async () => {
    const head = createHead()

    const hookTags = new Promise((resolve) => {
      head.hooks.hook('resolved:tags', (tags) => {
        resolve(tags)
      })
    })

    head.addEntry({
      title: 'test',
    })
    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body></body></html>',
    )
    await head.updateDOM(dom.window.document)

    const tags = await hookTags
    expect(tags[0].tag).toEqual('title')
    expect(tags[0]._runtime.textContent).toEqual('test')
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "_runtime": {
            "entryId": 0,
            "position": 0,
            "textContent": "test",
          },
          "props": {},
          "tag": "title",
        },
      ]
    `)
  })

  test('write tags', async () => {
    const head = createHead()

    const hookTags = new Promise((resolve) => {
      head.hooks.hook('resolved:tags', (tags) => {
        for (const k in tags)
          tags[k].props.extra = true

        resolve(tags)
      })
    })

    head.addEntry({
      title: 'test',
    })
    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body></body></html>',
    )
    await head.updateDOM(dom.window.document)

    const hooks = await hookTags
    expect(hooks[0].props.extra).toBeTruthy()
    expect(hooks[0]).toMatchInlineSnapshot(`
      {
        "_runtime": {
          "entryId": 0,
          "position": 0,
          "textContent": "test",
        },
        "props": {
          "extra": true,
        },
        "tag": "title",
      }
    `)
  })
})
