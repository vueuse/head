import anyTest, { TestFn } from "ava"
import { computed, createSSRApp, h, ref } from "vue"
import { renderToString } from "@vue/server-renderer"
import { createHead, renderHeadToString, useHead } from "../src"
import { HeadObject, HeadObjectPlain } from "../src/types"

const test = anyTest as TestFn

test("basic", async (t) => {
  const head = createHead()
  const app = createSSRApp({
    setup() {
      const titleTemplate = ref("%s - My site")
      useHead({
        title: `hello`,
        titleTemplate,
        htmlAttrs: {
          lang: ref("zh"),
        },
        bodyAttrs: {
          "data-some-body-attr": "some-value",
        },
        meta: [
          {
            name: "description",
            content: ref("test"),
          },
          {
            name: "description",
            content: "desc 2",
          },
          {
            property: "og:locale:alternate",
            content: "fr",
            key: "fr",
          },
          {
            property: "og:locale:alternate",
            content: "zh",
            key: "zh",
          },
        ],
        link: [
          {
            as: "style",
            href: "/style.css",
          },
        ],
        style: [
          {
            children: "* { color: red }",
            body: true,
          },
        ],
        script: [
          {
            key: "foo-script",
            src: "foo.js",
          },
        ],
      })
      return () => <div>hi</div>
    },
  })
  app.use(head)
  await renderToString(app)

  const headResult = renderHeadToString(head)
  t.snapshot(headResult)
  t.is(headResult.htmlAttrs, ` lang="zh" data-head-attrs="lang"`)
})

test("computed", async (t) => {
  const head = createHead()
  const app = createSSRApp({
    setup() {
      const title = ref("")
      useHead(
        computed<HeadObject>(() => {
          return {
            title: title.value,
          }
        }),
      )
      title.value = "hello"
      return () => <div>hi</div>
    },
  })
  app.use(head)
  await renderToString(app)

  const headResult = renderHeadToString(head)
  t.snapshot(headResult.headTags)
})

test("reactive", async (t) => {
  const head = createHead()
  const app = createSSRApp({
    setup() {
      const title = ref("")
      const scripts = ref<Required<HeadObject>["script"]>([])
      const urlMeta = computed<Required<HeadObjectPlain>["meta"][number]>(
        () => {
          return {
            property: "og:url",
            content: "test",
          }
        },
      )
      useHead({
        title,
        htmlAttrs: {
          lang: "test",
          dir: "ltr",
        },
        meta: [
          {
            name: "description",
            content: computed(() => `${title.value} this is my description`),
            "data-unknown-attr": "test",
          },
          {
            property: "og:fake-prop",
            content: "test",
          },
          {
            name: "fake-name-prop",
            content: "test",
          },
          urlMeta,
        ],
        script: scripts,
      })
      scripts.value.push({
        src: "foo.js",
      })
      title.value = "hello"
      return () => <div>hi</div>
    },
  })
  app.use(head)
  await renderToString(app)

  const headResult = renderHeadToString(head)
  t.snapshot(headResult.headTags)
})

test("malformed", async (t) => {
  const head = createHead()
  const app = createSSRApp({
    setup() {
      useHead({
        // @ts-expect-error functions not allowed
        title: function () {
          return "my title"
        },
        meta: [
          {
            // @ts-expect-error number is not valid for name
            name: 123,
            "data-unknown-attr": "test",
            // @ts-expect-error meta cannot have children
            children: "test",
          },
          {
            name: "some-flag",
            // @ts-expect-error boolean is not valid for name
            content: true,
          },
          {
            property: "og:fake-prop",
            // @ts-expect-error arrays not allowed
            content: ["test1", "test2"],
          },
        ],
      })
      return () => <div>hi</div>
    },
  })
  app.use(head)
  await renderToString(app)

  const headResult = renderHeadToString(head)
  t.snapshot(headResult.headTags)
})
