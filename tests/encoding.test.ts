import { JSDOM } from 'jsdom'
import { createHead, renderHeadToString } from '../src'

describe('encoding', () => {
  it('ssr encodes textContent', async () => {
    const head = createHead()
    head.push({
      htmlAttrs: {
        onload: 'console.log(\'executed\')',
      },
      script: [{
        src: 'javascript:console.log(\'xss\');',
        innerHTML: 'alert(2)',
      }],
      noscript: [
        {
          innerHTML: '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
        },
      ],
    })
    const { htmlAttrs, headTags } = await renderHeadToString(head)
    expect(headTags).toMatchInlineSnapshot(`
      "<script src=\\"javascript:console.log('xss');\\">alert(2)</script>
      <noscript><iframe src=\\"https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX\\" height=\\"0\\" width=\\"0\\" style=\\"display:none;visibility:hidden\\"></iframe></noscript>"
    `)
    expect(htmlAttrs).toMatchInlineSnapshot('" onload=\\"console.log(\'executed\')\\""')
  })

  it('ssr jailbreak', async () => {
    const head = createHead()
    head.push({
      meta: [
        {
          '> console.alert("test")':
                '<style>body { background: red; }</style>',
        },
      ],
    },
    )
    const { headTags } = await renderHeadToString(head)
    // valid html (except for the tag name)
    expect(headTags).toMatchInlineSnapshot(
      '"<meta > console.alert(\\"test\\")=\\"<style>body { background: red; }</style>\\">"',
    )
  })

  it('ssr google maps', async () => {
    const head = createHead()
    head.push({
      script: [
        {
          src: 'https://polyfill.io/v3/polyfill.min.js?features=default',
        },
        {
          'src': 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&v=weekly',
          'data-key': 'AIzaSyD9hQ0Z7Y9XQX8Zjwq7Q9Z2YQ9Z2YQ9Z2Y',
          'defer': true,
          'body': true,
        },
      ],
    })
    const ssr = await renderHeadToString(head)

    // valid html
    expect(ssr).toMatchInlineSnapshot(`
      {
        "bodyAttrs": "",
        "bodyTags": "<script src=\\"https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&v=weekly\\" data-key=\\"AIzaSyD9hQ0Z7Y9XQX8Zjwq7Q9Z2YQ9Z2YQ9Z2Y\\" defer=\\"\\"></script>",
        "bodyTagsOpen": "",
        "headTags": "<script src=\\"https://polyfill.io/v3/polyfill.min.js?features=default\\"></script>",
        "htmlAttrs": "",
      }
    `)
  })

  // Note: This should be fixed in a separate PR, possibly don't allow scripts without using useHeadRaw
  it('ssr xss', async () => {
    const externalApiHeadData = {
      script: [
        {
          children: 'console.alert("xss")',
        },
      ],
    }
    const head = createHead()
    head.push(externalApiHeadData)
    const { headTags } = await renderHeadToString(head)
    expect(headTags).toMatchInlineSnapshot(
      '"<script>console.alert(\\"xss\\")</script>"',
    )
  })

  it('csr xss', async () => {
    const externalApiHeadData = {
      script: [
        {
          innerHTML: 'console.alert("xss")',
        },
      ],
    }
    const head = createHead()
    head.push(externalApiHeadData)

    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body></body></html>',
    )

    head.updateDOM(dom.window.document, true)

    expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot(
      '""',
    )
  })
})
