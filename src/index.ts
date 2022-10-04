import type {
  App,
} from 'vue'
import {
  inject, nextTick,
  onBeforeUnmount,
  watchEffect,
} from 'vue'
import type { MergeHead } from '@zhead/schema'
import {
  PROVIDE_KEY,
} from './constants'
import { resolveHeadEntry, sortTags, tagDedupeKey } from './utils'
import type {
  DomUpdateCtx,
  HeadEntry, HeadEntryOptions,
  HeadObjectPlain, HeadTag, HookBeforeDomUpdate,
  HookTagsResolved,
  TagKeys, UseHeadInput,
  UseHeadRawInput,
} from './types'
import { updateDOM } from './dom/update-dom'

export * from './types'

export interface HeadClient<T extends MergeHead = {}> {
  install: (app: App) => void

  headTags: HeadTag[]

  addHeadObjs: (objs: UseHeadInput<T>, options?: HeadEntryOptions) => () => void

  removeHeadObjs: (objs: UseHeadInput<T>) => void

  updateDOM: (document?: Document, force?: boolean) => void

  /**
   * Array of user provided functions to hook into before the DOM is updated.
   *
   * When returning false from this function, it will block DOM updates, this can be useful when stopping dom updates
   * between page transitions.
   *
   * You are able to modify the payload of hook using this.
   */
  hookBeforeDomUpdate: HookBeforeDomUpdate
  /**
   * Array of user provided functions to hook into after the tags have been resolved (deduped and sorted).
   */
  hookTagsResolved: HookTagsResolved
}

/**
 * Inject the head manager instance
 * Exported for advanced usage or library integration, you probably don't need this
 */
export const injectHead = <T extends MergeHead = {}>() => {
  const head = inject<HeadClient<T>>(PROVIDE_KEY)

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
  if (typeof template === 'function')
    return template(title)

  return template.replace('%s', title ?? '')
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
        tags.push({ tag: key, props: { textContent: obj[key] } })
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
              const props = convertLegacyKey(item)
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

export const createHead = <T extends MergeHead = {}>(initHeadObject?: UseHeadInput<T>) => {
  let allHeadObjs: HeadEntry<T>[] = []
  const previousTags = new Set<string>()

  const hookBeforeDomUpdate: HookBeforeDomUpdate = []
  const hookTagsResolved: HookTagsResolved = []

  if (initHeadObject)
    allHeadObjs.push({ input: initHeadObject })

  let domUpdateTick: Promise<void> | null = null
  let domCtx: DomUpdateCtx

  const head: HeadClient<T> = {
    install(app) {
      app.config.globalProperties.$head = head
      app.provide(PROVIDE_KEY, head)
    },

    hookBeforeDomUpdate,
    hookTagsResolved,

    /**
     * Get deduped tags
     */
    get headTags() {
      const deduped: HeadTag[] = []
      const deduping: Record<string, HeadTag> = {}

      const resolvedHeadObjs = allHeadObjs.map(resolveHeadEntry)

      const titleTemplate = resolvedHeadObjs
        .map(i => i.input.titleTemplate)
        .reverse()
        .find(i => i != null)

      resolvedHeadObjs.forEach((objs, headObjectIdx) => {
        const tags = headObjToTags(objs.input)
        tags.forEach((tag, tagIdx) => {
          // used to restore the order after deduping
          // a large number is needed otherwise the position will potentially duplicate (this support 10k tags)
          // ideally we'd use the total tag count but this is too hard to calculate with the current reactivity
          tag._position = headObjectIdx * 10000 + tagIdx
          // avoid untrusted data providing their own options key (fixes XSS)
          if (tag._options)
            delete tag._options
          // tag inherits options from useHead registration
          if (objs.options)
            tag._options = objs.options

          // resolve titles
          if (titleTemplate && tag.tag === 'title') {
            tag.props.textContent = renderTitleTemplate(
              titleTemplate,
              tag.props.textContent,
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
      const tags = deduped.sort((a, b) => a._position! - b._position!)

      if (head.hookTagsResolved) {
        for (const k in head.hookTagsResolved)
          head.hookTagsResolved[k](tags)
      }

      return tags
    },

    addHeadObjs(objs, options?) {
      const ctx = allHeadObjs.push({ input: objs, options })
      return () => {
        allHeadObjs = allHeadObjs.splice(ctx, 1)
      }
    },

    removeHeadObjs(objs) {
      allHeadObjs = allHeadObjs.filter(_objs => _objs.input !== objs)
    },

    updateDOM: (document?: Document, force?: boolean) => {
      // within the debounced dom update we need to compute all the tags so that watchEffects still works
      domCtx = {
        title: undefined,
        htmlAttrs: {},
        bodyAttrs: {},
        actualTags: {},
      }

      // head sorting here is not guaranteed to be honoured
      for (const tag of head.headTags.sort(sortTags)) {
        if (tag.tag === 'title') {
          domCtx.title = tag.props.textContent
          continue
        }
        if (tag.tag === 'htmlAttrs') {
          Object.assign(domCtx.htmlAttrs, tag.props)
          continue
        }
        if (tag.tag === 'bodyAttrs') {
          Object.assign(domCtx.bodyAttrs, tag.props)
          continue
        }

        domCtx.actualTags[tag.tag] = domCtx.actualTags[tag.tag] || []
        domCtx.actualTags[tag.tag].push(tag)
      }
      const doDomUpdate = () => {
        // allow integration to disable dom update and / or modify it
        if (head.hookBeforeDomUpdate) {
          for (const k in head.hookBeforeDomUpdate) {
            const res = head.hookBeforeDomUpdate[k](domCtx.actualTags)
            if (res === false)
              return
          }
        }
        updateDOM({ domCtx, document, previousTags })
        domUpdateTick = null
      }
      if (force) {
        doDomUpdate()
        return
      }
      domUpdateTick = domUpdateTick || nextTick(() => doDomUpdate())
    },
  }

  return head
}

const IS_BROWSER = typeof window !== 'undefined'

const _useHead = <T extends MergeHead = {}>(headObj: UseHeadInput<T>, options: HeadEntryOptions = {}) => {
  const head = injectHead()

  const removeHeadObjs = head.addHeadObjs(headObj, options)

  if (IS_BROWSER) {
    watchEffect(() => {
      head.updateDOM()
    })

    onBeforeUnmount(() => {
      removeHeadObjs()
      head.updateDOM()
    })
  }
}

export const useHead = <T extends MergeHead = {}>(headObj: UseHeadInput<T>) => {
  _useHead(headObj)
}

export const useHeadRaw = (headObj: UseHeadRawInput) => {
  _useHead(headObj, { raw: true })
}

export * from './components'
export * from './dom'
export * from './ssr'
export * from './utils'
