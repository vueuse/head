import {
  App,
  computed,
  inject,
  onBeforeUnmount,
  ref,
  Ref,
  unref,
  watchEffect,
} from 'vue'
import { PROVIDE_KEY, HEAD_COUNT_KEY, HEAD_ATTRS_KEY } from './constants'
import { createElement } from './create-element'
import { stringifyAttrs } from './stringify-attrs'

export type HeadAttrs = { [k: string]: any }

export type HeadObject = {
  title?: string
  meta?: HeadAttrs[]
  link?: HeadAttrs[]
  base?: HeadAttrs
  style?: HeadAttrs[]
  script?: HeadAttrs[]
  htmlAttrs?: HeadAttrs
  bodyAttrs?: HeadAttrs
}

export type HeadTag = {
  tag: string
  props: {
    [k: string]: any
  }
}

export type Head = {
  install: (app: App) => void

  headTags: HeadTag[]

  addHeadTags: (tags: HeadTag[]) => void

  removeHeadTags: (tags: HeadTag[]) => void

  updateDOM: () => void
}

const getTagKey = (props: any) => {
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

const injectHead = () => {
  const head = inject<Head>(PROVIDE_KEY)

  if (!head) {
    throw new Error(`You may forget to apply app.use(head)`)
  }

  return head
}

const headObjToTags = (obj: HeadObject) => {
  const tags: HeadTag[] = []

  for (const key of Object.keys(obj) as Array<keyof HeadObject>) {
    if (key === 'title') {
      tags.push({ tag: key, props: { children: obj[key] } })
    } else if (key === 'base') {
      tags.push({ tag: key, props: { key: 'default', ...obj[key] } })
    } else {
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
  const keys = Object.keys(attrs)

  for (const key of keys) {
    const value = attrs[key]
    if (value === false) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, value)
    }
  }

  el.setAttribute(HEAD_ATTRS_KEY, keys.join(','))
}

const insertTags = (tags: HeadTag[]) => {
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
    newElements.push(createElement(tag.tag, tag.props))
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
  const headTags: HeadTag[] = []

  const head: Head = {
    install(app) {
      app.config.globalProperties.$head = head
      app.provide(PROVIDE_KEY, head)
    },

    headTags,

    addHeadTags(tags) {
      tags.forEach((tag) => {
        if (tag.tag === 'meta' || tag.tag === 'base') {
          // Remove tags with the same key
          const key = getTagKey(tag.props)
          if (key) {
            let index = -1

            for (let i = 0; i < headTags.length; i++) {
              const prev = headTags[i]
              const prevValue = prev.props[key.name]
              const nextValue = tag.props[key.name]
              if (prev.tag === tag.tag && prevValue === nextValue) {
                index = i
                break
              }
            }

            if (index !== -1) {
              headTags.splice(index, 1)
            }
          }
        }

        headTags.push(tag)
      })
    },

    removeHeadTags(tags) {
      tags.forEach((tag) => {
        const index = headTags.indexOf(tag)
        if (index !== -1) {
          headTags.splice(index, 1)
        }
      })
    },

    updateDOM() {
      insertTags(headTags)
    },
  }
  return head
}

const IS_BROWSER = typeof window !== 'undefined'

export const useHead = (
  obj: HeadObject | Ref<HeadObject> | (() => HeadObject),
) => {
  const headObj = typeof obj === 'function' ? computed(obj) : ref(obj)
  const head = injectHead()

  if (IS_BROWSER) {
    let tags: HeadTag[] | undefined

    watchEffect(() => {
      if (tags) {
        head.removeHeadTags(tags)
      }
      tags = headObjToTags(unref(headObj))
      head.addHeadTags(tags)
      head.updateDOM()
    })

    onBeforeUnmount(() => {
      if (tags) {
        head.removeHeadTags(tags)
        head.updateDOM()
      }
    })
  } else {
    head.addHeadTags(headObjToTags(unref(headObj)))
  }
}

const tagToString = (tag: HeadTag) => {
  let attrs = stringifyAttrs(tag.props)

  if (tag.props.children) {
    return `<${tag.tag}${attrs}>${tag.props.children}</${tag.tag}>`
  }
  return `<${tag.tag}${attrs}/>`
}

export const renderHeadToString = (head: Head) => {
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
  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}" />`)
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
