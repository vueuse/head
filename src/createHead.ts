import type { HeadTag, MaybeComputedRef, MergeHead, ReactiveHead } from '@unhead/vue'
import { createHead as createUnhead, debouncedRenderDOMHead, renderDOMHead } from '@unhead/vue'
import type { ActiveHeadEntry, Head, HeadEntryOptions, Unhead } from '@unhead/schema'
import type { Plugin } from 'vue'

export interface LegacyHeadClient<T> {
  headTags: () => Promise<HeadTag[]>

  addHeadObjs: (objs: T, options?: HeadEntryOptions) => ActiveHeadEntry<T>

  updateDOM: (document?: Document, force?: boolean) => void
}

export type UseHeadInput<T extends MergeHead> = MaybeComputedRef<ReactiveHead<T>>

export type VueUseHead<T extends MergeHead = {}> = Unhead<UseHeadInput<T>> & LegacyHeadClient<UseHeadInput<T>> & Plugin

export function createHead<T extends MergeHead = {}>(initHeadObject?: Head<T>): VueUseHead<T> {
  const head = createUnhead() as VueUseHead<T>

  // make migration easier
  const legacyHead: LegacyHeadClient<ReactiveHead<T>> = {
    headTags() {
      return head.resolveTags()
    },
    addHeadObjs(input, options) {
      return head.push(input, options)
    },
    updateDOM(document, force) {
      if (force)
        renderDOMHead(head, { document })
      else
        debouncedRenderDOMHead(head, { delayFn: fn => setTimeout(() => fn(), 50), document })
    },
  }

  head.headTags = legacyHead.headTags
  // @ts-expect-error untyped
  head.addHeadObjs = legacyHead.addHeadObjs
  head.updateDOM = legacyHead.updateDOM

  if (initHeadObject)
    head.push(initHeadObject)

  return head
}
