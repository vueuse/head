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
  useTagTitle,
  useTagBase,
  useTagMeta,
  useSeoMeta,
  useTagMetaFlat,
  useTagLink,
  useTagScript,
  useTagStyle,
  useTagNoscript,
  useHtmlAttrs,
  useBodyAttrs,
  useTitleTemplate,
  useServerHead,
  useServerTagTitle,
  useServerTagBase,
  useServerTagMeta,
  useServerTagMetaFlat,
  useServerTagLink,
  useServerTagScript,
  useServerTagStyle,
  useServerTagNoscript,
  useServerHtmlAttrs,
  useServerBodyAttrs,
  useServerTitleTemplate,
} from '@unhead/vue'
