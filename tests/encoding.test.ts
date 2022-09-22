import { computed } from "vue"
import { createHead, renderHeadToString } from "../src"

describe("encoding", () => {
  it("google maps", async () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        script: [
          {
            src: "https://polyfill.io/v3/polyfill.min.js?features=default",
            defer: false,
            body: false,
          },
          {
            src: "https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&v=weekly",
            defer: true,
            body: true,
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
      '"<script src=\\"https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&v=weekly\\" defer data-meta-body=\\"true\\"></script>"',
    )
  })

  // Note: This should be fixed in a seperate PR, possibly don't allow scripts without using useHeadRaw
  it("xss", async () => {
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
      '"<script>console.alert(\\"xss\\")</script><meta name=\\"head:count\\" content=\\"1\\">"',
    )
  })
})
