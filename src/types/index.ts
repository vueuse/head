import type { MergeHead } from '@zhead/schema'
import type {
  HandlesDuplicates,
  HasRenderPriority,
  HasTextContent,
  HeadObjectPlain, RendersToBody,
  ResolvedUseHeadInput,
} from './schema'

export * from './schema'

export interface HeadAttrs { [k: string]: any }

export type HookBeforeDomUpdate = (() => Promise<void | boolean> | void | boolean)
export type HookTagsResolved = ((tags: HeadTag[]) => Promise<void> | void)
export type HookEntriesResolved = ((entries: HeadEntry[]) => Promise<void> | void)

export type HeadTagOptions = HeadEntryOptions & HandlesDuplicates &
HasRenderPriority &
RendersToBody &
HasTextContent

export interface HeadEntryOptions { safe?: boolean; resolved?: boolean; beforeTagRender?: (tag: HeadTag) => void }
export interface HeadEntry<T extends MergeHead = {}> {
  options: HeadEntryOptions
  tags: HeadTag[]
  input: ResolvedUseHeadInput<T>
  resolved: boolean
  id: number
}

export type TagKeys = keyof HeadObjectPlain

export interface HeadTag {
  tag: TagKeys
  props: Record<string, any>
  children?: string
  runtime?: { position?: number; entryId?: number; beforeTagRender?: (tag: HeadTag) => void }
  options?: HeadTagOptions
}

export interface HeadObjectApi<T extends MergeHead = {}> {
  update: (resolvedInput: ResolvedUseHeadInput<T>) => void
  remove: () => void
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

export type { MaybeComputedRef } from '@vueuse/shared'
