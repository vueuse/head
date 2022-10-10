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

type Hook = Promise<void> | void

export interface HeadHooks {
  'before:dom': (ctx: { render: boolean; previousTags: Set<string> }) => Hook
  'resolved:entries': (entries: HeadEntry[]) => Hook
  'resolved:tags': (tags: HeadTag[]) => Hook
}

export type HeadTagRuntime = HeadEntryOptions & HandlesDuplicates &
HasRenderPriority &
RendersToBody &
HasTextContent & { position: number; entryId: number }

export interface HeadTag {
  tag: TagKeys
  props: {
    [k: string]: any
  }
  _runtime: HeadTagRuntime
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
