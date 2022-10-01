import type {
  App,
  Ref,
} from 'vue'
import {
  inject,
  onBeforeUnmount,
  ref,
  shallowRef,
  unref,
  watchEffect,
} from 'vue'
import {
  PROVIDE_KEY,
} from './constants'
import { sortTags, tagDedupeKey } from './utils'
import type {
  HeadAttrs,
  HeadObject,
  HeadObjectPlain, HeadTag, MaybeRef,
  TagKeys,
} from './types'
import { setAttrs, updateElements } from './dom'

export * from './types'

export interface HeadClient {
  install: (app: App) => void

  headTags: HeadTag[]

  addHeadObjs: (objs: Ref<HeadObjectPlain>) => void

  removeHeadObjs: (objs: Ref<HeadObjectPlain>) => void

  updateDOM: (document?: Document) => void
}

/**
 * Inject the head manager instance
 * Exported for advanced usage or library integration, you probably don't need this
 */
export const injectHead = () => {
  const head = inject<HeadClient>(PROVIDE_KEY)

  if (!head)
    throw new Error('You may forget to apply app.use(head)')

  return head
}

const acceptFields: Array<TagKeys> = [
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

const renderTitleTemplate = (
  template: Required<HeadObjectPlain>['titleTemplate'],
  title?: string,
): string => {
  if (template == null)
    return ''
  if (typeof template === 'string')
    return template.replace('%s', title ?? '')

  return template(unref(title))
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
    if (obj[key] == null)
      continue

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
              const props = convertLegacyKey(unref(item))
              // unref item to support ref array entries
              tags.push({ tag: key, props })
            })
          }
          else if (value) {
            tags.push({ tag: key, props: convertLegacyKey(value) })
          }
        }
        break
    }
  }

  return tags
}

export const createHead = (initHeadObject?: MaybeRef<HeadObjectPlain>) => {
  let allHeadObjs: Ref<HeadObjectPlain>[] = []
  const previousTags = new Set<string>()

  if (initHeadObject)
    allHeadObjs.push(shallowRef(initHeadObject))

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

      const titleTemplate = allHeadObjs
        .map(i => unref(i).titleTemplate)
        .reverse()
        .find(i => i != null)

      allHeadObjs.forEach((objs, headObjectIdx) => {
        const tags = headObjToTags(unref(objs))
        tags.forEach((tag, tagIdx) => {
          // used to restore the order after deduping
          // a large number is needed otherwise the position will potentially duplicate (this support 10k tags)
          // ideally we'd use the total tag count but this is too hard to calculate with the current reactivity
          tag._position = headObjectIdx * 10000 + tagIdx
          // resolve titles
          if (titleTemplate && tag.tag === 'title') {
            tag.props.children = renderTitleTemplate(
              titleTemplate,
              tag.props.children,
            )
          }
          // Remove tags with the same key
          const dedupeKey = tagDedupeKey(tag)
          if (dedupeKey)
            deduping[dedupeKey] = tag
          else
            deduped.push(tag)
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
      allHeadObjs = allHeadObjs.filter(_objs => _objs !== objs)
    },

    updateDOM(document = window.document) {
      let title: string | undefined
      const htmlAttrs: HeadAttrs = {}
      const bodyAttrs: HeadAttrs = {}

      const actualTags: Record<string, HeadTag[]> = {}

      // head sorting here is not guaranteed to be honoured
      for (const tag of head.headTags.sort(sortTags)) {
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

      if (title !== undefined)
        document.title = title

      setAttrs(document.documentElement, htmlAttrs)
      setAttrs(document.body, bodyAttrs)
      const tags = new Set([...Object.keys(actualTags), ...previousTags])
      for (const tag of tags)
        updateElements(document, tag, actualTags[tag] || [])

      previousTags.clear()
      Object.keys(actualTags).forEach(i => previousTags.add(i))
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

export * from './components'
export * from './dom'
export * from './ssr'
export * from './utils'
