import anyTest, { TestFn } from "ava"
import { computed } from "vue"
import { createHead, renderHeadToString } from "../src"

const test = anyTest as TestFn

test("charset first", async (t) => {
  const head = createHead()
  head.addHeadObjs(
    computed(() => ({
      script: [
        {
          src: "/my-important-script.js",
        },
      ],
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
          charset: "utf-8",
        },
      ],
    })),
  )
  const { headTags } = renderHeadToString(head)
  t.true(headTags.startsWith('<meta charset="utf-8">'))
})

test("base early", async (t) => {
  const head = createHead()
  head.addHeadObjs(
    computed(() => ({
      script: [
        {
          src: "/my-important-script.js",
        },
      ],
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
          charset: "utf-8",
        },
      ],
      base: {
        href: "/base",
      },
    })),
  )
  const { headTags } = renderHeadToString(head)
  t.true(headTags.startsWith('<meta charset="utf-8"><base href="/base">'))
})

test("CSP early", async (t) => {
  const head = createHead()
  head.addHeadObjs(
    computed(() => ({
      script: [
        {
          src: "/my-important-script.js",
        },
      ],
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
          "http-equiv": "content-security-policy",
          content: "test",
        },
      ],
    })),
  )
  const { headTags } = renderHeadToString(head)
  t.true(
    headTags.startsWith(
      '<meta http-equiv="content-security-policy" content="test">',
    ),
  )
})

test("manual priority", async (t) => {
  const head = createHead()
  head.addHeadObjs(
    computed(() => ({
      script: [
        {
          src: "/not-important-script.js",
        },
      ],
    })),
  )
  head.addHeadObjs(
    computed(() => ({
      script: [
        {
          src: "/very-important-script.js",
          renderPriority: 1,
        },
      ],
    })),
  )
  const { headTags } = renderHeadToString(head)
  t.snapshot(headTags)
  t.true(
    headTags.startsWith(
      '<script src="/very-important-script.js">',
    ),
  )
})
