import type { MergeHead } from '@zhead/schema'
import type {
  HandlesDuplicates,
  HasRenderPriority,
  HasTextContent,
  HeadEntryOptions,
  RendersToBody, ResolvedUseHeadInput,
  TagKeys,
} from './schema'

export * from './schema'

export interface HeadAttrs { [k: string]: any }

export type HookBeforeDomUpdate = ((ctx: DomUpdateCtx) => Promise<void | boolean> | void | boolean)[]
export type HookTagsResolved = ((tags: HeadTag[]) => Promise<void> | void)[]

export interface HeadTag {
  tag: TagKeys
  props: HandlesDuplicates &
  HasRenderPriority &
  RendersToBody &
  HasTextContent & {
    [k: string]: any
  }
  _options?: HeadEntryOptions
  _position?: number
}

export interface HeadObjectApi<T extends MergeHead = {}> {
  update: (resolvedInput: ResolvedUseHeadInput<T>) => void
  remove: () => void
}

export interface DomUpdateCtx {
  title: string | undefined
  htmlAttrs: HeadAttrs
  bodyAttrs: HeadAttrs
  tags: Record<string, HeadTag[]>
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
