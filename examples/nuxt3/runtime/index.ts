import { useHead as _useHead } from "#_head"
import { HeadObject } from "@vueuse/head"
import type { MetaObject as _MetaObject } from "#_head"

export type MetaObject = HeadObject

export function useHead(meta: HeadObject) {
  _useHead(meta as _MetaObject)
}
