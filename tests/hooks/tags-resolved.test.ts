import { JSDOM } from 'jsdom'
import { createHead } from '../../src'

describe('hook tags resolved', () => {
  test('read tags', async () => {
    const head = createHead()

    const hookTags = new Promise((resolve) => {
      head.internalHooks.hook('tags:resolve', (ctx) => {
        resolve(ctx.tags)
      })
    })

    head.push({
      title: 'test',
    })
    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body></body></html>',
    )
    await head.updateDOM(dom.window.document)

    const tags = await hookTags
    expect(tags[0].tag).toEqual('title')
    expect(tags[0].children).toEqual('test')
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "_d": "title",
          "_e": 0,
          "_p": 0,
          "children": "test",
          "props": {},
          "tag": "title",
        },
      ]
    `)
  })

  test('write tags', async () => {
    const head = createHead()

    const hookTags = new Promise((resolve) => {
      head.internalHooks.hook('tags:resolve', (ctx) => {
        for (const k in ctx.tags)
          ctx.tags[k].props.extra = true

        resolve(ctx.tags)
      })
    })

    head.push({
      title: 'test',
    })
    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body></body></html>',
    )
    await head.updateDOM(dom.window.document)

    const tags = await hookTags
    expect(tags[0].props.extra).toBeTruthy()
    expect(tags[0]).toMatchInlineSnapshot(`
      {
        "_d": "title",
        "_e": 0,
        "_p": 0,
        "children": "test",
        "props": {
          "extra": true,
        },
        "tag": "title",
      }
    `)
  })
})
