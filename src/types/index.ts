import type { MergeHead } from '@zhead/schema'
import type {
  HandlesDuplicates,
  HasRenderPriority,
  HasTextContent, HeadEntry,
  HeadEntryOptions,
  RendersToBody, ResolvedUseHeadInput,
  TagKeys,
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

export interface HeadTag {
  tag: TagKeys
  props: Record<string, any>
  children?: string
  runtime?: { position?: number; entryId?: number }
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
