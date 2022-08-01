import {
  App,
  defineComponent,
  inject,
  onBeforeUnmount,
  ref,
  Ref,
  UnwrapRef,
  watchEffect,
  VNode,
  unref,
  shallowRef,
} from 'vue'
import {
  PROVIDE_KEY,
  HEAD_COUNT_KEY,
  HEAD_ATTRS_KEY,
  SELF_CLOSING_TAGS,
  BODY_TAG_ATTR_NAME,
} from './constants'
import { createElement } from './create-element'
import { stringifyAttrs } from './stringify-attrs'
import { isEqualNode } from './utils'

type MaybeRef<T> = T | Ref<T>

export type HeadAttrs = { [k: string]: any }

export type HeadObject = {
  title?: MaybeRef<string>
  titleTemplate?: MaybeRef<string> | ((chunk?: MaybeRef<string>) => string)
  meta?: MaybeRef<HeadAttrs[]>
  link?: MaybeRef<HeadAttrs[]>
  base?: MaybeRef<HeadAttrs>
  style?: MaybeRef<HeadAttrs[]>
  script?: MaybeRef<HeadAttrs[]>
  noscript?: MaybeRef<HeadAttrs[]>
  htmlAttrs?: MaybeRef<HeadAttrs>
  bodyAttrs?: MaybeRef<HeadAttrs>
}

export type HeadObjectPlain = UnwrapRef<HeadObject>

export type HeadTag = {
  tag: string
  props: {
    body?: boolean
    [k: string]: any
  }
}

export type HeadClient = {
  install: (app: App) => void

  headTags: HeadTag[]

  addHeadObjs: (objs: Ref<HeadObjectPlain>) => void

  removeHeadObjs: (objs: Ref<HeadObjectPlain>) => void

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

const getTagKey = (
  props: Record<string, any>,
): { name: string; value: any } | void => {
  const names = ['key', 'id', 'name', 'property']
  for (const n of names) {
    const value =
      // Probably an HTML Element
      typeof props.getAttribute === 'function'
        ? props.hasAttribute(n)
          ? props.getAttribute(n)
          : undefined
        : props[n]
    if (value !== undefined) {
      return { name: n, value: value }
    }
  }
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

const acceptFields: Array<keyof Omit<HeadObject, 'titleTemplate'>> = [
  'title',
  'meta',
  'link',
  'base',
  'style',
  'script',
  'noscript',
  'htmlAttrs',
  'bodyAttrs',
]

const renderTemplate = (
  template: HeadObjectPlain['titleTemplate'],
  title?: string,
): string => {
  if (template == null) return ''
  if (typeof template === 'string') {
    return template.replace('%s', title ?? '')
  }

  return template(title)
}

const headObjToTags = (obj: HeadObjectPlain) => {
  const tags: HeadTag[] = []
  const keys = Object.keys(obj) as Array<keyof HeadObjectPlain>

  for (const key of keys) {
    if (obj[key] == null) continue

    switch (key) {
      case 'title':
        tags.push({ tag: key, props: { children: obj[key] } })
        break
      case 'titleTemplate':
        break
      case 'base':
        tags.push({ tag: key, props: { key: 'default', ...obj[key] } })
        break
      default:
        if (acceptFields.includes(key)) {
          const value = obj[key]
          if (Array.isArray(value)) {
            value.forEach((item) => {
              tags.push({ tag: key, props: item })
            })
          } else if (value) {
            tags.push({ tag: key, props: value })
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
    for (const key of existingAttrs.split(',')) {
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
    el.setAttribute(HEAD_ATTRS_KEY, keys.join(','))
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
    ? Number(headCountEl.getAttribute('content'))
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
    headCountEl = document.createElement('meta')
    headCountEl.setAttribute('name', HEAD_COUNT_KEY)
    headCountEl.setAttribute('content', '0')
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
      body.insertAdjacentElement('beforeend', t.element)
    } else {
      head.insertBefore(t.element, headCountEl)
    }
  })
  headCountEl.setAttribute(
    'content',
    '' +
      (headCount -
        oldHeadElements.length +
        newElements.filter((t) => !t.body).length),
  )
}

export const createHead = (initHeadObject?: MaybeRef<HeadObjectPlain>) => {
  let allHeadObjs: Ref<HeadObjectPlain>[] = []
  let previousTags = new Set<string>()

  if (initHeadObject) {
    allHeadObjs.push(shallowRef(initHeadObject))
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

      const titleTemplate = allHeadObjs
        .map((i) => unref(i).titleTemplate)
        .reverse()
        .find((i) => i != null)

      allHeadObjs.forEach((objs) => {
        const tags = headObjToTags(unref(objs))
        tags.forEach((tag) => {
          if (
            tag.tag === 'meta' ||
            tag.tag === 'base' ||
            tag.tag === 'script'
          ) {
            // Remove tags with the same key
            const key = getTagKey(tag.props)
            if (key) {
              let index = -1

              for (let i = 0; i < deduped.length; i++) {
                const prev = deduped[i]
                const prevValue = prev.props[key.name]
                const nextValue = tag.props[key.name]
                if (prev.tag === tag.tag && prevValue === nextValue) {
                  index = i
                  break
                }
              }

              if (index !== -1) {
                deduped.splice(index, 1)
              }
            }
          }

          if (titleTemplate && tag.tag === 'title') {
            tag.props.children = renderTemplate(
              titleTemplate,
              tag.props.children,
            )
          }

          deduped.push(tag)
        })
      })

      return deduped
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

      for (const tag of head.headTags) {
        if (tag.tag === 'title') {
          title = tag.props.children
          continue
        }
        if (tag.tag === 'htmlAttrs') {
          Object.assign(htmlAttrs, tag.props)
          continue
        }
        if (tag.tag === 'bodyAttrs') {
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

const IS_BROWSER = typeof window !== 'undefined'

export const useHead = (obj: MaybeRef<HeadObject>) => {
  const head = injectHead()
  const headObj = ref(obj) as Ref<HeadObjectPlain>

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
  let attrs = stringifyAttrs(tag.props)
  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}${
      isBodyTag ? ' ' + ` ${BODY_TAG_ATTR_NAME}="true"` : ''
    }>`
  }

  return `<${tag.tag}${attrs}${
    isBodyTag ? ` ${BODY_TAG_ATTR_NAME}="true"` : ''
  }>${tag.props.children || ''}</${tag.tag}>`
}

export const renderHeadToString = (head: HeadClient): HTMLResult => {
  const tags: string[] = []
  let titleTag = ''
  let htmlAttrs: HeadAttrs = {}
  let bodyAttrs: HeadAttrs = {}
  let bodyTags: string[] = []
  for (const tag of head.headTags) {
    if (tag.tag === 'title') {
      titleTag = tagToString(tag)
    } else if (tag.tag === 'htmlAttrs') {
      Object.assign(htmlAttrs, tag.props)
    } else if (tag.tag === 'bodyAttrs') {
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
      return titleTag + tags.join('')
    },
    get htmlAttrs() {
      return stringifyAttrs({
        ...htmlAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(htmlAttrs).join(','),
      })
    },
    get bodyAttrs() {
      return stringifyAttrs({
        ...bodyAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(bodyAttrs).join(','),
      })
    },
    get bodyTags() {
      return bodyTags.join('')
    },
  }
}

const addVNodeToHeadObj = (node: VNode, obj: HeadObjectPlain) => {
  const type =
    node.type === 'html'
      ? 'htmlAttrs'
      : node.type === 'body'
      ? 'bodyAttrs'
      : (node.type as keyof HeadObjectPlain)

  if (typeof type !== 'string' || !(type in obj)) return

  const props = {
    ...node.props,
    children: Array.isArray(node.children)
      ? // @ts-expect-error
        node.children[0]!.children
      : node.children,
  } as HeadAttrs
  if (Array.isArray(obj[type])) {
    ;(obj[type] as HeadAttrs[]).push(props)
  } else if (type === 'title') {
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
    if (typeof node.type === 'symbol' && Array.isArray(node.children)) {
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
  name: 'Head',

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
