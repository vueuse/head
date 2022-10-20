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
import { resolveHeadEntriesToTags, resolveUnrefHeadInput } from './utils'
import type {
  HeadEntry,
  HeadEntryOptions, HeadObjectApi, HeadTag,
  HookBeforeDomUpdate, HookEntriesResolved,
  HookTagsResolved, ResolvedUseHeadInput, UseHeadInput,
} from './types'
import { updateDOM } from './dom/update-dom'
import { resolveHeadEntries } from './ssr'
import { escapeHtml, escapeJS, sanitiseAttrName, sanitiseAttrValue } from './encoding'

export * from './types'

export interface HeadClient<T extends MergeHead = {}> {
  install: (app: App) => void

  headEntries: HeadEntry<T>[]

  addEntry: (entry: UseHeadInput<T>, options?: HeadEntryOptions) => HeadObjectApi<T>
  addReactiveEntry: (objs: UseHeadInput<T>, options?: HeadEntryOptions) => () => void

  updateDOM: (document?: Document, force?: boolean) => void

  hooks:
  /**
   * Array of user provided functions to hook into before the DOM is updated.
   *
   * When returning false from this function, it will block DOM updates, this can be useful when stopping dom updates
   * between page transitions.
   *
   * You are able to modify the payload of hook using this.
   */
  Record<'before:dom', HookBeforeDomUpdate[]> &
  Record<'resolved:entries', HookEntriesResolved[]> &
  /**
     * Array of user provided functions to hook into after the tags have been resolved (deduped and sorted).
     */
  Record<'resolved:tags', HookTagsResolved[]>

  /**
   * Backwards compatibility function to fetch the headTags.
   *
   * This function forces reactivity resolving and is not performant.
   *
   * @deprecated Use hooks.
   */
  headTags: HeadTag[]
  /**
   * Backwards compatibility function to add a head obj.
   *
   * Note: This will not support reactivity. Use `addReactiveEntry` instead.
   *
   * @deprecated Use addEntry
   */
  addHeadObjs: (entry: UseHeadInput<T>, options?: HeadEntryOptions) => HeadObjectApi<T>
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

export const createHead = <T extends MergeHead = {}>(initHeadObject?: ResolvedUseHeadInput<T>) => {
  let entries: HeadEntry<T>[] = []
  // counter for keeping unique ids of head object entries
  let entryId = 0

  const previousTags = new Set<string>()

  let domUpdateTick: Promise<void> | null = null

  const head: HeadClient<T> = {
    install(app) {
      // vue 3 only
      if (app.config.globalProperties)
        app.config.globalProperties.$head = head
      app.provide(PROVIDE_KEY, head)
    },

    hooks: {
      'before:dom': [],
      'resolved:tags': [],
      'resolved:entries': [],
    },

    get headEntries() {
      return entries
    },

    /**
     * Backwards compatibility with < v1.
     */
    get headTags() {
      // Note: we don't call hooks here as this function is sync
      const resolvedEntries = resolveHeadEntries(head.headEntries)
      return resolveHeadEntriesToTags(resolvedEntries)
    },

    addHeadObjs(input, options) {
      return head.addEntry(input, options)
    },

    addEntry(input, options = {}) {
      let resolved = false
      if (options?.resolved) {
        resolved = true
        delete options.resolved
      }
      const entry: any = {
        id: entryId++,
        options,
        resolved,
        input,
      }
      entries.push(entry as HeadEntry<T>)
      return {
        remove() {
          entries = entries.filter(_objs => _objs.id !== entry.id)
        },
        update(updatedInput: ResolvedUseHeadInput<T>) {
          entries = entries.map((e) => {
            if (e.id === entry.id)
              e.input = updatedInput
            return e
          })
        },
      }
    },

    async updateDOM(document?: Document, force?: boolean) {
      // within the debounced dom update we need to compute all the tags so that watchEffects still works
      const doDomUpdate = () => {
        domUpdateTick = null
        return updateDOM(head, previousTags, document)
      }

      if (force)
        return doDomUpdate()

      return domUpdateTick = domUpdateTick || new Promise(resolve => nextTick(() => resolve(doDomUpdate())))
    },

    // browser only
    addReactiveEntry(input: UseHeadInput<T>, options = {}) {
      let entrySideEffect: HeadObjectApi<T> | null = null
      const cleanUpWatch = watchEffect(() => {
        const resolvedInput = resolveUnrefHeadInput(input)
        if (entrySideEffect === null) {
          entrySideEffect = head.addEntry(
            resolvedInput,
            { ...options, resolved: true },
          )
        }
        else {
          entrySideEffect.update(resolvedInput)
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
    head.addEntry(initHeadObject)

  return head
}

const _useHead = <T extends MergeHead = {}>(headObj: UseHeadInput<T>, options: HeadEntryOptions = {}) => {
  const head = injectHead()

  if (!IS_BROWSER) {
    head.addEntry(headObj, options)
  }
  else {
    const cleanUp = head.addReactiveEntry(headObj, options)
    onBeforeUnmount(() => {
      cleanUp()
      head.updateDOM()
    })
  }
}
export const useHead = <T extends MergeHead = {}>(headObj: UseHeadInput<T>) => {
  _useHead(headObj)
}

export const useHeadSafe = <T extends MergeHead = {}>(headObj: UseHeadInput<T>) => {
  _useHead(headObj, {
    beforeTagRender: (tag) => {
      for (const p in tag.props) {
        const value = tag.props[p]
        const key = sanitiseAttrName(p)
        delete tag.props[p]
        if (!p.startsWith('on') && p !== 'innerHTML') {
          if (p === 'href' || p === 'src')
            tag.props[key] = encodeURI(value)
          tag.props[key] = sanitiseAttrValue(value)
        }
      }
      if (tag.children) {
        if (tag.tag === 'script')
          delete tag.children
        else
          tag.children = escapeJS(escapeHtml(tag.children))
      }
    },
  },
  )
}

export { HeadVuePlugin } from './vue2-plugin'

export * from './components'
export * from './dom'
export * from './ssr'
export * from './utils'
