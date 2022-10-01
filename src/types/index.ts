import type { Ref } from 'vue'
import type { HandlesDuplicates, HasRenderPriority, RendersInnerContent, RendersToBody, TagKeys } from './schema'

export * from './schema'

export type MaybeRef<T> = T | Ref<T>

export interface HeadAttrs { [k: string]: any }

export interface HeadTag {
  tag: TagKeys
  props: HandlesDuplicates &
  HasRenderPriority &
  RendersToBody &
  RendersInnerContent & {
    [k: string]: any
  }
  _position?: number
}

export interface HTMLResult {
  // Tags in `<head>`
  readonly headTags: string
  // Attributes for `<html>`
  readonly htmlAttrs: string
  // Attributes for `<body>`
  readonly bodyAttrs: string
  // Tags in `<body>`
  readonly bodyTags: string
}
