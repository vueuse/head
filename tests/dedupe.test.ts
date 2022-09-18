import { computed } from "vue"
import { createHead, renderHeadToString } from "../src"

describe("dedupe", () => {
  it("dedupes desc", async () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        meta: [
          {
            name: "something-else",
            content: "test",
          },
          {
            name: "description",
            content: "desc",
          },
        ],
      })),
    )
    head.addHeadObjs(
      computed(() => ({
        meta: [
          {
            name: "description",
            content: "desc 2",
          },
        ],
      })),
    )
    const { headTags } = renderHeadToString(head)
    expect(
      headTags.includes('<meta name="description" content="desc 2">'),
    ).toBeTruthy()
    expect(headTags.split("description").length === 2).toBeTruthy()
  })

  it("dedupes key", async () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        meta: [
          {
            myCustomMeta: "first",
            key: "custom",
          },
          {
            myCustomMeta: "second",
            key: "custom",
          },
        ],
      })),
    )
    const { headTags } = renderHeadToString(head)
    expect(headTags.startsWith('<meta myCustomMeta="second">')).toBeTruthy()
    expect(headTags.split("myCustomMeta").length === 2).toBeTruthy()
  })

  test("dedupes canonical", async () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        link: [
          {
            rel: "canonical",
            href: "https://website.com",
          },
          {
            rel: "canonical",
            href: "https://website.com/new",
          },
        ],
      })),
    )
    const { headTags } = renderHeadToString(head)
    expect(
      headTags.startsWith(
        '<link rel="canonical" href="https://website.com/new">',
      ),
    ).toBeTruthy()
    expect(headTags.split("canonical").length === 2).toBeTruthy()
  })

  test("dedupes charset", async () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        meta: [
          {
            charset: "utf-8-overridden",
          },
          {
            charset: "utf-8-two",
          },
        ],
      })),
    )
    head.addHeadObjs(
      computed(() => ({
        meta: [
          {
            charset: "utf-8",
          },
        ],
      })),
    )
    const { headTags } = renderHeadToString(head)
    expect(headTags.startsWith('<meta charset="utf-8">')).toBeTruthy()
    expect(headTags.split("charset").length === 2).toBeTruthy()
  })

  test("dedupes base", async () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        base: {
          href: "/old",
          target: "_blank",
        },
      })),
    )
    head.addHeadObjs(
      computed(() => ({
        base: {
          href: "/",
        },
      })),
    )
    const { headTags } = renderHeadToString(head)
    expect(headTags.split("base").length === 2).toBeTruthy()
    expect(headTags.startsWith('<base href="/">')).toBeTruthy()
  })

  test("dedupes http-equiv", async () => {
    const head = createHead()
    head.addHeadObjs(
      computed(() => ({
        meta: [
          {
            "http-equiv": "content-security-policy",
            content: "default-src https",
          },
        ],
      })),
    )
    head.addHeadObjs(
      computed(() => ({
        meta: [
          {
            "http-equiv": "content-security-policy",
            content:
              "default-src https: 'unsafe-eval' 'unsafe-inline'; object-src 'none'",
          },
        ],
      })),
    )
    const { headTags } = renderHeadToString(head)
    expect(headTags.split("http-equiv").length === 2).toBeTruthy()
  })
})
