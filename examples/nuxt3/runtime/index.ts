import type { HeadObject, UseHeadRawInput } from '@vueuse/head'
import type { MaybeComputedRef } from '@vueuse/shared'
import { useNuxtApp } from '#app'

export type MetaObject = HeadObject

export function useHead(meta: MaybeComputedRef<MetaObject>) {
  useNuxtApp()._useHead(meta)
}

export function useHeadRaw(meta: UseHeadRawInput) {
  useNuxtApp()._useHead(meta, { raw: true })
}

export function useMeta(meta: MetaObject) {
  useHead(meta)
}
