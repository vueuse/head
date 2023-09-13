import { renderSSRHead } from '@unhead/ssr'
import type { MergeHead, ReactiveHead } from '@unhead/vue'
import type { Head } from '@unhead/schema'
import { Vue2ProvideUnheadPlugin } from '@unhead/vue'
import type { Plugin } from 'vue'

// @ts-expect-error broken types
import type { VueHeadClientPollyFill } from '@unhead/vue/polyfill'

export const HeadVuePlugin = Vue2ProvideUnheadPlugin as Plugin
export const renderHeadToString = <T extends MergeHead = {}>(head: VueHeadClientPollyFill<T>) => renderSSRHead(head.unhead)
export type HeadObjectPlain = Head
export type HeadObject = ReactiveHead
