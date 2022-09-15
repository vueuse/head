import anyTest, { TestFn } from "ava"
import { computed } from "vue"
import { createHead, renderHeadToString } from "../src"

const test = anyTest as TestFn

test("dedupes key", async (t) => {
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
  t.true(headTags.startsWith('<meta myCustomMeta="second">'))
  t.true(headTags.split("myCustomMeta").length === 2)
})

test("dedupes canonical", async (t) => {
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
  t.true(
    headTags.startsWith(
      '<link rel="canonical" href="https://website.com/new">',
    ),
  )
  t.true(headTags.split("canonical").length === 2)
})

test("dedupes charset", async (t) => {
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
  t.true(headTags.startsWith('<meta charset="utf-8">'))
  t.true(headTags.split("charset").length === 2)
})

test("dedupes base", async (t) => {
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
  t.true(headTags.split("base").length === 2)
  t.true(headTags.startsWith('<base href="/">'))
})

test("dedupes http-equiv", async (t) => {
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
  t.true(headTags.split("http-equiv").length === 2)
})
