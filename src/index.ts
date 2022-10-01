import {
  App,
  defineComponent,
  inject,
  onBeforeUnmount,
  ref,
  Ref,
  watchEffect,
  VNode,
} from "vue"
import {
  PROVIDE_KEY,
  HEAD_COUNT_KEY,
  HEAD_ATTRS_KEY,
  SELF_CLOSING_TAGS,
  BODY_TAG_ATTR_NAME,
} from "./constants"
import { createElement } from "./create-element"
import { stringifyAttrs } from "./stringify-attrs"
import { isEqualNode, resolveHeadInput } from "./utils"
import type { HeadObjectPlain, TagKeys, HasRenderPriority } from "./types"
import { HandlesDuplicates, RendersInnerContent, RendersToBody } from "./types"
import { UseHeadInput } from "./types"

export * from "./types"

export type HeadAttrs = { [k: string]: any }

export type HeadTag = {
  tag: TagKeys
  props: HandlesDuplicates &
    HasRenderPriority &
    RendersToBody &
    RendersInnerContent & {
      [k: string]: any
    }
  _position?: number
}

export type HeadClient = {
  install: (app: App) => void

  headTags: HeadTag[]

  addHeadObjs: (objs: UseHeadInput) => void

  removeHeadObjs: (objs: UseHeadInput) => void

  updateDOM: (document?: Document) => void
}

export interface HTMLResult {
  // Tags in `<head>`
  readonly headTags: string
  // Attributes for `<html>`
  readonly htmlAttrs: string
  // Attributes for `<body>`
  readonly bodyAttrs: string
  // Tags in `<body>`
  readonly bodyTags: string
}

const tagDedupeKey = <T extends HeadTag>(tag: T) => {
  // only meta, base and script tags will be deduped
  if (!["meta", "base", "script", "link"].includes(tag.tag)) {
    return false
  }
  const { props, tag: tagName } = tag
  // must only be a single base so we always dedupe
  if (tagName === "base") {
    return "base"
  }
  // support only a single canonical
  if (tagName === "link" && props.rel === "canonical") {
    return "canonical"
  }
  // must only be a single charset
  if (props.charset) {
    return "charset"
  }
  const name = ["key", "id", "name", "property", "http-equiv"]
  for (const n of name) {
    let value = undefined
    // Probably an HTML Element
    if (typeof props.getAttribute === "function" && props.hasAttribute(n)) {
      value = props.getAttribute(n)
    } else {
      value = props[n]
    }
    if (value !== undefined) {
      // for example: meta-name-description
      return `${tagName}-${n}-${value}`
    }
  }
  return false
}

/**
 * Inject the head manager instance
 * Exported for advanced usage or library integration, you probably don't need this
 */
export const injectHead = () => {
  const head = inject<HeadClient>(PROVIDE_KEY)

  if (!head) {
    throw new Error(`You may forget to apply app.use(head)`)
  }

  return head
}

const acceptFields: Array<TagKeys> = [
  "title",
  "meta",
  "link",
  "base",
  "style",
  "script",
  "noscript",
  "htmlAttrs",
  "bodyAttrs",
]

const renderTemplate = (
  template: Required<HeadObjectPlain>["titleTemplate"],
  title?: string,
): string => {
  if (template == null) return ""
  if (typeof template === "string") {
    return template.replace("%s", title ?? "")
  }
  return template(title)
}

const headObjToTags = (obj: HeadObjectPlain) => {
  const tags: HeadTag[] = []
  const keys = Object.keys(obj) as Array<keyof HeadObjectPlain>

  const convertLegacyKey = (value: any) => {
    if (value.hid) {
      value.key = value.hid
      delete value.hid
    }
    if (value.vmid) {
      value.key = value.vmid
      delete value.vmid
    }
    return value
  }

  for (const key of keys) {
    if (obj[key] == null) continue

    switch (key) {
      case "title":
        tags.push({ tag: key, props: { children: obj[key] } })
        break
      case "titleTemplate":
        break
      case "base":
        tags.push({ tag: key, props: { key: "default", ...obj[key] } })
        break
      default:
        if (acceptFields.includes(key)) {
          const value = obj[key]
          if (Array.isArray(value)) {
            value.forEach((item) => {
              const props = convertLegacyKey(item)
              // unref item to support ref array entries
              tags.push({ tag: key, props })
            })
          } else if (value) {
            tags.push({ tag: key, props: convertLegacyKey(value) })
          }
        }
        break
    }
  }

  return tags
}

const setAttrs = (el: Element, attrs: HeadAttrs) => {
  const existingAttrs = el.getAttribute(HEAD_ATTRS_KEY)
  if (existingAttrs) {
    for (const key of existingAttrs.split(",")) {
      if (!(key in attrs)) {
        el.removeAttribute(key)
      }
    }
  }

  const keys: string[] = []

  for (const key in attrs) {
    const value = attrs[key]
    if (value == null) continue

    if (value === false) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, value)
    }

    keys.push(key)
  }

  if (keys.length) {
    el.setAttribute(HEAD_ATTRS_KEY, keys.join(","))
  } else {
    el.removeAttribute(HEAD_ATTRS_KEY)
  }
}

const updateElements = (
  document = window.document,
  type: string,
  tags: HeadTag[],
) => {
  const head = document.head
  const body = document.body
  let headCountEl = head.querySelector(`meta[name="${HEAD_COUNT_KEY}"]`)
  let bodyMetaElements = body.querySelectorAll(`[${BODY_TAG_ATTR_NAME}]`)
  const headCount = headCountEl
    ? Number(headCountEl.getAttribute("content"))
    : 0
  const oldHeadElements: Element[] = []
  const oldBodyElements: Element[] = []

  if (bodyMetaElements) {
    for (let i = 0; i < bodyMetaElements.length; i++) {
      if (
        bodyMetaElements[i] &&
        bodyMetaElements[i].tagName?.toLowerCase() === type
      ) {
        oldBodyElements.push(bodyMetaElements[i])
      }
    }
  }
  if (headCountEl) {
    for (
      let i = 0, j = headCountEl.previousElementSibling;
      i < headCount;
      i++, j = j?.previousElementSibling || null
    ) {
      if (j?.tagName?.toLowerCase() === type) {
        oldHeadElements.push(j)
      }
    }
  } else {
    headCountEl = document.createElement("meta")
    headCountEl.setAttribute("name", HEAD_COUNT_KEY)
    headCountEl.setAttribute("content", "0")
    head.append(headCountEl)
  }
  let newElements = tags.map((tag) => ({
    element: createElement(tag.tag, tag.props, document),
    body: tag.props.body ?? false,
  }))

  newElements = newElements.filter((newEl) => {
    for (let i = 0; i < oldHeadElements.length; i++) {
      const oldEl = oldHeadElements[i]
      if (isEqualNode(oldEl, newEl.element)) {
        oldHeadElements.splice(i, 1)
        return false
      }
    }
    for (let i = 0; i < oldBodyElements.length; i++) {
      const oldEl = oldBodyElements[i]
      if (isEqualNode(oldEl, newEl.element)) {
        oldBodyElements.splice(i, 1)
        return false
      }
    }
    return true
  })

  oldBodyElements.forEach((t) => t.parentNode?.removeChild(t))
  oldHeadElements.forEach((t) => t.parentNode?.removeChild(t))
  newElements.forEach((t) => {
    if (t.body === true) {
      body.insertAdjacentElement("beforeend", t.element)
    } else {
      head.insertBefore(t.element, headCountEl)
    }
  })
  headCountEl.setAttribute(
    "content",
    "" +
      (headCount -
        oldHeadElements.length +
        newElements.filter((t) => !t.body).length),
  )
}

export const createHead = (initHeadObject?: UseHeadInput) => {
  let allHeadObjs: UseHeadInput[] = []
  let previousTags = new Set<string>()

  if (initHeadObject) {
    allHeadObjs.push(initHeadObject)
  }

  const head: HeadClient = {
    install(app) {
      app.config.globalProperties.$head = head
      app.provide(PROVIDE_KEY, head)
    },
    /**
     * Get deduped tags
     */
    get headTags() {
      const deduped: HeadTag[] = []
      const deduping: Record<string, HeadTag> = {}

      const resolvedHeadObjs = allHeadObjs.map(resolveHeadInput)

      const titleTemplate = resolvedHeadObjs
        .map((i) => i.titleTemplate)
        .reverse()
        .find((i) => i != null)

      resolvedHeadObjs.forEach((objs, headObjectIdx) => {
        const tags = headObjToTags(objs)
        tags.forEach((tag, tagIdx) => {
          // used to restore the order after deduping
          // a large number is needed otherwise the position will potentially duplicate (this support 10k tags)
          // ideally we'd use the total tag count but this is too hard to calculate with the current reactivity
          tag._position = headObjectIdx * 10000 + tagIdx
          // resolve titles
          if (titleTemplate && tag.tag === "title") {
            tag.props.children = renderTemplate(
              titleTemplate,
              tag.props.children,
            )
          }
          // Remove tags with the same key
          const dedupeKey = tagDedupeKey(tag)
          if (dedupeKey) {
            deduping[dedupeKey] = tag
          } else {
            deduped.push(tag)
          }
        })
      })

      // add the entries we were deduping
      deduped.push(...Object.values(deduping))
      // ensure their original positions are kept
      return deduped.sort((a, b) => a._position! - b._position!)
    },

    addHeadObjs(objs) {
      allHeadObjs.push(objs)
    },

    removeHeadObjs(objs) {
      allHeadObjs = allHeadObjs.filter((_objs) => _objs !== objs)
    },

    updateDOM(document = window.document) {
      let title: string | undefined
      let htmlAttrs: HeadAttrs = {}
      let bodyAttrs: HeadAttrs = {}

      const actualTags: Record<string, HeadTag[]> = {}

      // head sorting here is not guaranteed to be honoured
      for (const tag of head.headTags.sort(sortTags)) {
        if (tag.tag === "title") {
          title = tag.props.children
          continue
        }
        if (tag.tag === "htmlAttrs") {
          Object.assign(htmlAttrs, tag.props)
          continue
        }
        if (tag.tag === "bodyAttrs") {
          Object.assign(bodyAttrs, tag.props)
          continue
        }

        actualTags[tag.tag] = actualTags[tag.tag] || []
        actualTags[tag.tag].push(tag)
      }

      if (title !== undefined) {
        document.title = title
      }
      setAttrs(document.documentElement, htmlAttrs)
      setAttrs(document.body, bodyAttrs)
      const tags = new Set([...Object.keys(actualTags), ...previousTags])
      for (const tag of tags) {
        updateElements(document, tag, actualTags[tag] || [])
      }
      previousTags.clear()
      Object.keys(actualTags).forEach((i) => previousTags.add(i))
    },
  }
  return head
}

const IS_BROWSER = typeof window !== "undefined"

export const useHead = (headObj: UseHeadInput) => {
  const head = injectHead()

  head.addHeadObjs(headObj)

  if (IS_BROWSER) {
    watchEffect(() => {
      head.updateDOM()
    })

    onBeforeUnmount(() => {
      head.removeHeadObjs(headObj)
      head.updateDOM()
    })
  }
}

const tagToString = (tag: HeadTag) => {
  let isBodyTag = false
  if (tag.props.body) {
    isBodyTag = true
    // avoid rendering body attr
    delete tag.props.body
  }
  if (tag.props.renderPriority) {
    delete tag.props.renderPriority
  }
  let attrs = stringifyAttrs(tag.props)
  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}${
      isBodyTag ? " " + ` ${BODY_TAG_ATTR_NAME}="true"` : ""
    }>`
  }

  return `<${tag.tag}${attrs}${
    isBodyTag ? ` ${BODY_TAG_ATTR_NAME}="true"` : ""
  }>${tag.props.children || ""}</${tag.tag}>`
}

const sortTags = (aTag: HeadTag, bTag: HeadTag) => {
  const tagWeight = (tag: HeadTag) => {
    if (tag.props.renderPriority) {
      return tag.props.renderPriority
    }
    switch (tag.tag) {
      // This element must come before other elements with attribute values of URLs
      case "base":
        return -1
      case "meta":
        // charset must come early in case there's non-utf8 characters in the HTML document
        if (tag.props.charset) {
          return -2
        }
        // CSP needs to be as it effects the loading of assets
        if (tag.props["http-equiv"] === "content-security-policy") {
          return 0
        }
        return 10
      default:
        // arbitrary safe number that can go up and down without conflicting
        return 10
    }
  }
  return tagWeight(aTag) - tagWeight(bTag)
}

export const renderHeadToString = (head: HeadClient): HTMLResult => {
  const tags: string[] = []
  let titleTag = ""
  let htmlAttrs: HeadAttrs = {}
  let bodyAttrs: HeadAttrs = {}
  let bodyTags: string[] = []

  for (const tag of head.headTags.sort(sortTags)) {
    if (tag.tag === "title") {
      titleTag = tagToString(tag)
    } else if (tag.tag === "htmlAttrs") {
      Object.assign(htmlAttrs, tag.props)
    } else if (tag.tag === "bodyAttrs") {
      Object.assign(bodyAttrs, tag.props)
    } else if (tag.props.body) {
      bodyTags.push(tagToString(tag))
    } else {
      tags.push(tagToString(tag))
    }
  }
  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}">`)

  return {
    get headTags() {
      return titleTag + tags.join("")
    },
    get htmlAttrs() {
      return stringifyAttrs({
        ...htmlAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(htmlAttrs).join(","),
      })
    },
    get bodyAttrs() {
      return stringifyAttrs({
        ...bodyAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(bodyAttrs).join(","),
      })
    },
    get bodyTags() {
      return bodyTags.join("")
    },
  }
}

const addVNodeToHeadObj = (node: VNode, obj: HeadObjectPlain) => {
  const type =
    node.type === "html"
      ? "htmlAttrs"
      : node.type === "body"
      ? "bodyAttrs"
      : (node.type as keyof HeadObjectPlain)

  if (typeof type !== "string" || !(type in obj)) return

  const props = {
    ...node.props,
    children: Array.isArray(node.children)
      ? // @ts-expect-error
        node.children[0]!.children
      : node.children,
  } as HeadAttrs
  if (Array.isArray(obj[type])) {
    ;(obj[type] as HeadAttrs[]).push(props)
  } else if (type === "title") {
    obj.title = props.children
  } else {
    ;(obj[type] as HeadAttrs) = props
  }
}

const vnodesToHeadObj = (nodes: VNode[]) => {
  const obj: HeadObjectPlain = {
    title: undefined,
    htmlAttrs: undefined,
    bodyAttrs: undefined,
    base: undefined,
    meta: [],
    link: [],
    style: [],
    script: [],
    noscript: [],
  }

  for (const node of nodes) {
    if (typeof node.type === "symbol" && Array.isArray(node.children)) {
      for (const childNode of node.children) {
        addVNodeToHeadObj(childNode as VNode, obj)
      }
    } else {
      addVNodeToHeadObj(node, obj)
    }
  }

  return obj
}

export const Head = /*@__PURE__*/ defineComponent({
  name: "Head",

  setup(_, { slots }) {
    const head = injectHead()

    let obj: Ref<HeadObjectPlain> | undefined

    onBeforeUnmount(() => {
      if (obj) {
        head.removeHeadObjs(obj)
        head.updateDOM()
      }
    })

    return () => {
      watchEffect(() => {
        if (!slots.default) return
        if (obj) {
          head.removeHeadObjs(obj)
        }
        obj = ref(vnodesToHeadObj(slots.default()))
        head.addHeadObjs(obj)
        if (IS_BROWSER) {
          head.updateDOM()
        }
      })
      return null
    }
  },
})
