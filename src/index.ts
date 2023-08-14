export * from './createHead'
export * from './legacy'
export * from './components'
export type { Unhead, HeadEntryOptions, MaybeComputedRef, UseHeadInput, MergeHead, ReactiveHead, HeadTag, ActiveHeadEntry } from '@unhead/vue'
// export opt-in utils
export { VueHeadMixin, unheadVueComposablesImports, Vue2ProvideUnheadPlugin, createHeadCore } from '@unhead/vue'
// export composables
export {
  injectHead,
  useHead,
  useSeoMeta,
  useServerSeoMeta,
  useHeadSafe,
  useServerHead,
  useServerHeadSafe,
} from '@unhead/vue'
