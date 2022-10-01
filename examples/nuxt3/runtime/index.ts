import type { HeadObject } from "@vueuse/head"
import { useNuxtApp } from "#app"

export type MetaObject = HeadObject

export function useHead(meta: MetaObject) {
  useNuxtApp()._useHead(meta)
}

export function useMeta(meta: MetaObject) {
  useHead(meta)
}
