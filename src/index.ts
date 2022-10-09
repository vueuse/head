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
import { resolveUnrefHeadInput, sortTags, tagDedupeKey } from './utils'
import type {
  DomUpdateCtx,
  HeadEntry, HeadEntryInput,
  HeadEntryOptions, HeadObjectApi, HeadObjectPlain,
  HeadTag,
  HookBeforeDomUpdate, HookTagsResolved,
  ResolvedUseHeadInput,
  TagKeys, UseHeadInput, UseHeadRawInput,
} from './types'
import { updateDOM } from './dom/update-dom'

export * from './types'

export interface HeadClient<T extends MergeHead = {}> {
  install: (app: App) => void

  headTags: HeadTag[]

  allHeadObjs: HeadEntry<T>[]

  /**
   * @deprecated Use addHeadEntry or setupReactiveHeadEntry for better performance.
   */
  addHeadObjs: (headObjs: UseHeadInput<T> | ResolvedUseHeadInput<T>) => () => void

  setupHeadEntry: (entry: HeadEntryInput<T>) => HeadObjectApi<T>
  setupReactiveHeadEntry: (objs: UseHeadInput<T>, options?: HeadEntryOptions) => () => void

  /**
   * @deprecated Use the return function from `addHeadObjs`
   */
  removeHeadObjs: (objs: ResolvedUseHeadInput<T>) => void

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

export const IS_BROWSER = typeof window !== 'undefined'

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

export const createHead = <T extends MergeHead = {}>(initHeadObject?: ResolvedUseHeadInput<T>) => {
  let allHeadObjs: HeadEntry<T>[] = []
  const previousTags = new Set<string>()
  // counter for keeping unique ids of head object entries
  let headObjId = 0

  const hookBeforeDomUpdate: HookBeforeDomUpdate = []
  const hookTagsResolved: HookTagsResolved = []

  let domUpdateTick: Promise<void> | null = null

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

      // ensure input is resolved
      allHeadObjs.forEach((e) => {
        // when SSR we need to re-resolve the input each time on demand
        if ((e.input && !IS_BROWSER) || !e.resolvedInput)
          e.resolvedInput = resolveUnrefHeadInput(e.input)
      })

      const titleTemplate = allHeadObjs
        .map(i => i.resolvedInput.titleTemplate)
        .reverse()
        .find(i => i != null)

      allHeadObjs.forEach((objs, headObjectIdx) => {
        const tags = headObjToTags(objs.resolvedInput)
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
          // validate XSS vectors
          if (!tag._options?.raw) {
            for (const k in tag.props) {
              if (k.startsWith('on')) {
                console.warn('[@vueuse/head] Warning, you must use `useHeadRaw` to set event listeners. See https://github.com/vueuse/head/pull/118', tag)
                delete tag.props[k]
              }
            }
            if (tag.props.innerHTML) {
              console.warn('[@vueuse/head] Warning, you must use `useHeadRaw` to use `innerHTML`', tag)
              delete tag.props.innerHTML
            }
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

      head.hookTagsResolved.forEach(fn => fn(tags))
      return tags.sort(sortTags)
    },

    allHeadObjs,

    addHeadObjs(headObjs) {
      // not resolved by default
      const api = head.setupHeadEntry({ input: headObjs })
      return () => api.remove()
    },

    setupHeadEntry(entry) {
      entry.id = entry.id || headObjId++
      entry.options = entry.options || {}
      allHeadObjs.push(entry as HeadEntry<T>)
      return {
        remove() {
          allHeadObjs = allHeadObjs.filter(_objs => _objs.id !== entry.id)
        },
        update(val: ResolvedUseHeadInput<T>) {
          allHeadObjs = allHeadObjs.map((_objs) => {
            if (_objs.id === entry.id)
              _objs.resolvedInput = val

            return _objs
          })
        },
      }
    },

    removeHeadObjs(objs) {
      allHeadObjs = allHeadObjs.filter(_objs => _objs.input !== objs)
    },

    updateDOM: (document?: Document, force?: boolean) => {
      // within the debounced dom update we need to compute all the tags so that watchEffects still works
      const doDomUpdate = () => {
        const domCtx: DomUpdateCtx = {
          title: undefined,
          htmlAttrs: {},
          bodyAttrs: {},
          actualTags: {},
        }

        // call first in case the dom update hook returns
        domUpdateTick = null
        // head sorting here is not guaranteed to be honoured
        for (const tag of head.headTags) {
          if (tag.tag === 'title') {
            domCtx.title = tag.props.textContent
            continue
          }
          if (tag.tag === 'htmlAttrs' || tag.tag === 'bodyAttrs') {
            Object.assign(domCtx[tag.tag], tag.props)
            continue
          }

          domCtx.actualTags[tag.tag] = domCtx.actualTags[tag.tag] || []
          domCtx.actualTags[tag.tag].push(tag)
        }

        // allow integration to disable dom update and / or modify it
        for (const k in head.hookBeforeDomUpdate) {
          if (head.hookBeforeDomUpdate[k](domCtx.actualTags) === false)
            return
        }
        updateDOM({ domCtx, document, previousTags })
      }
      if (force) {
        doDomUpdate()
        return
      }
      domUpdateTick = domUpdateTick || nextTick(() => {
        doDomUpdate()
      })
    },

    setupReactiveHeadEntry(entry: UseHeadInput<T>, options = {}) {
      let entrySideEffect: HeadObjectApi<T> | null = null
      const cleanUpWatch = watchEffect(() => {
        const meta = resolveUnrefHeadInput(entry)
        if (entrySideEffect === null) {
          entrySideEffect = head.setupHeadEntry({
            resolvedInput: meta,
            options,
          })
        }
        else {
          entrySideEffect.update(meta)
        }
        if (IS_BROWSER)
          head.updateDOM()
      })
      return () => {
        cleanUpWatch()
        if (entrySideEffect)
          entrySideEffect.remove()
      }
    },
  }

  if (initHeadObject)
    head.setupHeadEntry({ resolvedInput: initHeadObject })

  return head
}

const _useHead = <T extends MergeHead = {}>(headObj: UseHeadInput<T>, options: HeadEntryOptions = {}) => {
  const head = injectHead()

  if (!IS_BROWSER) {
    head.setupHeadEntry({ input: headObj, options })
  }
  else {
    const cleanUp = head.setupReactiveHeadEntry(headObj, options)
    onBeforeUnmount(() => {
      cleanUp()
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
