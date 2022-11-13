import type { HeadTag, MaybeComputedRef, MergeHead, ReactiveHead } from '@unhead/vue'
import { createHead as createUnhead, debouncedRenderDOMHead, renderDOMHead } from '@unhead/vue'
import type { ActiveHeadEntry, Head, HeadEntryOptions, Unhead } from '@unhead/schema'
import type { Plugin } from 'vue'

export type HookBeforeDomUpdate = ((tags: Record<string, HeadTag[]>) => void | boolean)[]
export type HookTagsResolved = ((tags: HeadTag[]) => void)[]

export interface LegacyHeadClient<T> {
  headTags: () => Promise<HeadTag[]>

  /**
   * @deprecated
   */
  addEntry: (objs: Head, options?: HeadEntryOptions) => ActiveHeadEntry<Head>
  /**
   * @deprecated
   */
  addReactiveEntry: (objs: MaybeComputedRef<ReactiveHead>, options?: HeadEntryOptions) => ActiveHeadEntry<MaybeComputedRef<ReactiveHead>>
  /**
   * @deprecated
   */
  addHeadObjs: (objs: T, options?: HeadEntryOptions) => ActiveHeadEntry<T>
  /**
   * @deprecated
   */
  updateDOM: (document?: Document, force?: boolean) => void


  /**
   * Array of user provided functions to hook into before the DOM is updated.
   *
   * When returning false from this function, it will block DOM updates, this can be useful when stopping dom updates
   * between page transitions.
   *
   * You are able to modify the payload of hook using this.
   *
   * @deprecated
   */
  hookBeforeDomUpdate: HookBeforeDomUpdate
  /**
   * Array of user provided functions to hook into after the tags have been resolved (deduped and sorted).
   * @deprecated
   */
  hookTagsResolved: HookTagsResolved
}

export type UseHeadInput<T extends MergeHead> = MaybeComputedRef<ReactiveHead<T>>

export type VueUseHead<T extends MergeHead = {}> = Unhead<UseHeadInput<T>> & LegacyHeadClient<UseHeadInput<T>> & Plugin

export function createHead<T extends MergeHead = {}>(initHeadObject?: Head<T>): VueUseHead<T> {
  const head = createUnhead() as VueUseHead<T>

  const hookBeforeDomUpdate: HookBeforeDomUpdate = []
  const hookTagsResolved: HookTagsResolved = []

  // make migration easier
  const legacyHead: LegacyHeadClient<ReactiveHead<T>> = {
    headTags() {
      return head.resolveTags()
    },
    addEntry(input, options) {
      return head.push(input, options)
    },
    addHeadObjs(input, options) {
      return head.push(input, options)
    },
    addReactiveEntry(input, options) {
      return head.push(input, options)
    },
    updateDOM(document, force) {
      if (force)
        renderDOMHead(head, { document })
      else
        debouncedRenderDOMHead(head, { delayFn: fn => setTimeout(() => fn(), 50), document })
    },
    hookBeforeDomUpdate,
    hookTagsResolved,
  }

  head.headTags = legacyHead.headTags
  // @ts-expect-error untyped
  head.addHeadObjs = legacyHead.addHeadObjs
  head.addEntry = legacyHead.addEntry
  head.addReactiveEntry = legacyHead.addReactiveEntry
  head.updateDOM = legacyHead.updateDOM

  if (initHeadObject)
    head.push(initHeadObject)

  return head
}
