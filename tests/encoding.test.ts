import { computed } from 'vue'
import { JSDOM } from 'jsdom'
import { createHead, renderHeadToString } from '../src'

describe('encoding', () => {
  it('ssr encodes textContent', () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        htmlAttrs: {
          onload: 'console.log(\'executed\')',
        },
        script: [{
          src: 'javascript:console.log(\'xss\');',
          innerHTML: 'alert(2)',
        }],
        noscript: [
          {
            textContent: '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
          },
        ],
      })),
    )
    const { htmlAttrs, headTags } = renderHeadToString(head)
    expect(headTags).toMatchInlineSnapshot('"<script src=\\"javascript:console.log(\\\\\'xss\\\\\');\\"></script><noscript>&lt;iframe src=&quot;https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX&quot; height=&quot;0&quot; width=&quot;0&quot; style=&quot;display:none;visibility:hidden&quot;&gt;&lt;/iframe&gt;</noscript><meta name=\\"head:count\\" content=\\"2\\">"')
    expect(htmlAttrs).toMatchInlineSnapshot('" data-head-attrs=\\"\\""')
  })

  it('ssr jailbreak', async () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        meta: [
          {
            '> console.alert("test")':
              '<style>body { background: red; }</style>',
          },
        ],
      })),
    )
    const { headTags } = renderHeadToString(head)
    // valid html (except for the tag name)
    expect(headTags).toMatchInlineSnapshot(
      '"<meta consolealerttest=\\"&lt;style&gt;body { background: red; }&lt;/style&gt;\\"><meta name=\\"head:count\\" content=\\"1\\">"',
    )
  })

  it('ssr google maps', async () => {
    const head = createHead()
    head.addHeadObjs(
      // @ts-expect-error computed issue
      computed(() => ({
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
      })),
    )
    const { headTags, bodyTags } = renderHeadToString(head)
    // valid html
    expect(headTags).toMatchInlineSnapshot(
      '"<script src=\\"https://polyfill.io/v3/polyfill.min.js?features=default\\"></script><meta name=\\"head:count\\" content=\\"1\\">"',
    )
    // valid html
    expect(bodyTags).toMatchInlineSnapshot(
      '"<script src=\\"https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&v=weekly\\" data-key=\\"AIzaSyD9hQ0Z7Y9XQX8Zjwq7Q9Z2YQ9Z2YQ9Z2Y\\" defer data-meta-body=\\"true\\"></script>"',
    )
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
    head.addHeadObjs(computed(() => externalApiHeadData))
    const { headTags } = renderHeadToString(head)
    expect(headTags).toMatchInlineSnapshot(
      '"<script>console.alert(&quot;xss&quot;)</script><meta name=\\"head:count\\" content=\\"1\\">"',
    )
  })

  it.only('csr xss', () => {
    const externalApiHeadData = {
      script: [
        {
          innerHTML: 'console.alert("xss")',
        },
      ],
    }
    const head = createHead()
    head.addHeadObjs(externalApiHeadData)

    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body></body></html>',
    )

    head.updateDOM(dom.window.document, true)

    expect(dom.window.document.head.innerHTML).toMatchInlineSnapshot(
      '"<script>console.alert(\\"xss\\")</script><meta name=\\"head:count\\" content=\\"1\\">"',
    )
  })
})
