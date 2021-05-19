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
} from 'vue'
import {
  PROVIDE_KEY,
  HEAD_COUNT_KEY,
  HEAD_ATTRS_KEY,
  SELF_CLOSING_TAGS,
} from './constants'
import { createElement } from './create-element'
import { stringifyAttrs } from './stringify-attrs'

type MaybeRef<T> = T | Ref<T>

export type HeadAttrs = { [k: string]: any }

export type HeadObject = {
  title?: MaybeRef<string>
  meta?: MaybeRef<HeadAttrs[]>
  link?: MaybeRef<HeadAttrs[]>
  base?: MaybeRef<HeadAttrs>
  style?: MaybeRef<HeadAttrs[]>
  script?: MaybeRef<HeadAttrs[]>
  htmlAttrs?: MaybeRef<HeadAttrs>
  bodyAttrs?: MaybeRef<HeadAttrs>
}

export type HeadObjectPlain = UnwrapRef<HeadObject>

export type HeadTag = {
  tag: string
  props: {
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
}

const getTagKey = (props: any): { name: string; value: any } | void => {
  if (props.key !== undefined) {
    return { name: 'key', value: props.key }
  }
  if (props.name !== undefined) {
    return { name: 'name', value: props.name }
  }
  if (props.property !== undefined) {
    return {
      name: 'property',
      value: props.property,
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

const acceptFields: Array<keyof HeadObject> = [
  'title',
  'meta',
  'link',
  'base',
  'style',
  'script',
  'htmlAttrs',
  'bodyAttrs',
]

const headObjToTags = (obj: HeadObjectPlain) => {
  const tags: HeadTag[] = []

  for (const key of Object.keys(obj) as Array<keyof HeadObjectPlain>) {
    if (obj[key] == null) continue

    if (key === 'title') {
      tags.push({ tag: key, props: { children: obj[key] } })
    } else if (key === 'base') {
      tags.push({ tag: key, props: { key: 'default', ...obj[key] } })
    } else if (acceptFields.includes(key)) {
      const value = obj[key]
      if (Array.isArray(value)) {
        value.forEach((item) => {
          tags.push({ tag: key, props: item })
        })
      } else if (value) {
        tags.push({ tag: key, props: value })
      }
    }
  }

  return tags
}

const setAttrs = (el: Element, attrs: HeadAttrs) => {
  const existingAttrs = el.getAttribute(HEAD_ATTRS_KEY)
  if (existingAttrs) {
    for (const key of existingAttrs.split(',')) {
      el.removeAttribute(key)
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

const insertTags = (tags: HeadTag[], document = window.document) => {
  const head = document.head
  let headCountEl = head.querySelector(`meta[name="${HEAD_COUNT_KEY}"]`)
  const headCount = headCountEl
    ? Number(headCountEl.getAttribute('content'))
    : 0
  const oldElements: Element[] = []
  if (headCountEl) {
    for (
      let i = 0, j = headCountEl.previousElementSibling;
      i < headCount;
      i++, j = j!.previousElementSibling
    ) {
      if (j) {
        oldElements.push(j)
      }
    }
  } else {
    headCountEl = document.createElement('meta')
    headCountEl.setAttribute('name', HEAD_COUNT_KEY)
    headCountEl.setAttribute('content', '0')
    head.append(headCountEl)
  }

  const newElements: Element[] = []
  let title: string | undefined
  let htmlAttrs: HeadAttrs = {}
  let bodyAttrs: HeadAttrs = {}

  for (const tag of tags) {
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

    // Remove tags with the same key
    if (tag.tag === 'meta') {
      let elementList: Element[] = []

      if (tag.props.name) {
        elementList = [
          ...head.querySelectorAll(`meta[name="${tag.props.name}"]`),
        ]
      } else if (tag.props.property) {
        elementList = [
          ...head.querySelectorAll(`meta[property="${tag.props.property}"]`),
        ]
      }

      for (const el of elementList) {
        if (!oldElements.includes(el)) {
          oldElements.push(el)
        }
      }
    }

    newElements.push(createElement(tag.tag, tag.props, document))
  }

  oldElements.forEach((el) => {
    el.remove()
  })
  if (title !== undefined) {
    document.title = title
  }
  setAttrs(document.documentElement, htmlAttrs)
  setAttrs(document.body, bodyAttrs)

  newElements.forEach((el) => {
    head.insertBefore(el, headCountEl)
  })
  headCountEl.setAttribute('content', '' + newElements.length)
}

export const createHead = () => {
  let allHeadObjs: Ref<HeadObjectPlain>[] = []

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

      allHeadObjs.forEach((objs) => {
        const tags = headObjToTags(objs.value)
        tags.forEach((tag) => {
          if (tag.tag === 'meta' || tag.tag === 'base') {
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

    updateDOM(document) {
      insertTags(head.headTags, document)
    },
  }
  return head
}

const IS_BROWSER = typeof window !== 'undefined'

export const useHead = (obj: MaybeRef<HeadObject>) => {
  const headObj = ref(obj) as Ref<HeadObjectPlain>
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
  let attrs = stringifyAttrs(tag.props)

  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}>`
  }

  return `<${tag.tag}${attrs}>${tag.props.children || ''}</${tag.tag}>`
}

export const renderHeadToString = (head: HeadClient): HTMLResult => {
  const tags: string[] = []
  let titleTag = ''
  let htmlAttrs: HeadAttrs = {}
  let bodyAttrs: HeadAttrs = {}
  for (const tag of head.headTags) {
    if (tag.tag === 'title') {
      titleTag = tagToString(tag)
    } else if (tag.tag === 'htmlAttrs') {
      Object.assign(htmlAttrs, tag.props)
    } else if (tag.tag === 'bodyAttrs') {
      Object.assign(bodyAttrs, tag.props)
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
  }

  for (const node of nodes) {
    const type =
      node.type === 'html'
        ? 'htmlAttrs'
        : node.type === 'body'
        ? 'bodyAttrs'
        : (node.type as keyof HeadObjectPlain)

    if (typeof type !== 'string' || !(type in obj)) continue

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
