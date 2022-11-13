import type { HeadTag, MaybeComputedRef, MergeHead, ReactiveHead, VueHeadClient } from '@unhead/vue'
import { createHead as createUnhead, debouncedRenderDOMHead, renderDOMHead, useHead } from '@unhead/vue'
import type { ActiveHeadEntry, Head, HeadEntry, HeadEntryOptions, Unhead } from '@unhead/schema'
import type { App } from 'vue'

export type HookBeforeDomUpdate = (() => Promise<void | boolean> | void | boolean)
export type HookTagsResolved = ((tags: HeadTag[]) => Promise<void> | void)
export type HookEntriesResolved = ((entries: HeadEntry<any>[]) => Promise<void> | void)

export interface LegacyHeadOptions {
  /**
   * @deprecated
   */
  resolved?: boolean
  /**
   * @deprecated
   */
  raw?: boolean
}

export interface HeadClient<T extends MergeHead = {}> {
  install: (app: App) => void

  resolveTags: () => Promise<HeadTag[]>

  headEntries: () => HeadEntry<MaybeComputedRef<ReactiveHead<T>>>[]
  push: (entry: MaybeComputedRef<ReactiveHead<T>>, options?: HeadEntryOptions) => ActiveHeadEntry<MaybeComputedRef<ReactiveHead<T>>>
  /**
   * @deprecated use `push`
   */
  addEntry: (entry: MaybeComputedRef<ReactiveHead<T>>, options?: HeadEntryOptions & LegacyHeadOptions) => ActiveHeadEntry<MaybeComputedRef<ReactiveHead<T>>>
  /**
   * @deprecated use `push`
   */
  addReactiveEntry: (objs: MaybeComputedRef<ReactiveHead<T>>, options?: HeadEntryOptions & LegacyHeadOptions) => () => void
  /**
   * @deprecated use `@unhead/dom`
   */
  updateDOM: (document?: Document, force?: boolean) => void

  internalHooks: Unhead['hooks']

  /**
   * @deprecated
   */
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
   * @deprecated Use `unhead.resolveTags()`.
   */
  headTags: () => Promise<HeadTag[]>
  /**
   * Backwards compatibility function to add a head obj.
   *
   * Note: This will not support reactivity. Use `addReactiveEntry` instead.
   *
   * @deprecated Use addEntry
   */
  addHeadObjs: (entry: MaybeComputedRef<ReactiveHead<T>>, options?: HeadEntryOptions) => ActiveHeadEntry<MaybeComputedRef<ReactiveHead<T>>>
  /**
   * @deprecated Does not do anything
   */
  removeHeadObjs: (entry: MaybeComputedRef<ReactiveHead<T>>) => void
  /**
   * Access the underlying unhead instance.
   */
  unhead: VueHeadClient<T>
}

export function createHead<T extends MergeHead = {}>(initHeadObject?: Head<T>): HeadClient<T> {
  const unhead = createUnhead<T>()

  // make migration easier
  const legacyHead: HeadClient<T> = {
    unhead,

    install(app) {
      // vue 3 only
      if (app.config.globalProperties)
        app.config.globalProperties.$head = unhead
      app.provide('usehead', unhead)
    },
    resolveTags() {
      return unhead.resolveTags()
    },
    headEntries() {
      return unhead.headEntries()
    },
    headTags() {
      return unhead.resolveTags()
    },
    push(input, options) {
      return unhead.push(input, options)
    },
    addEntry(input, options) {
      return unhead.push(input, options)
    },
    addHeadObjs(input, options) {
      return unhead.push(input, options)
    },
    addReactiveEntry(input, options) {
      const api = useHead(input, options)
      if (typeof api !== 'undefined')
        return api.dispose

      return () => {}
    },
    removeHeadObjs() {
      // not able to handle this
    },
    updateDOM(document, force) {
      if (force)
        renderDOMHead(unhead, { document })
      else
        debouncedRenderDOMHead(unhead, { delayFn: fn => setTimeout(() => fn(), 50), document })
    },

    internalHooks: unhead.hooks,
    hooks: {
      'before:dom': [],
      'resolved:tags': [],
      'resolved:entries': [],
    },
  }

  unhead.hooks.hook('dom:beforeRender', (ctx) => {
    for (const hook of legacyHead.hooks['before:dom']) {
      if (hook() === false)
        ctx.shouldRender = false
    }
  })

  if (initHeadObject)
    legacyHead.addHeadObjs(initHeadObject)

  return legacyHead
}
