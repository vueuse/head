import type { MergeHead, Head as PlainHead } from '@zhead/schema'
import type { ReactiveHead } from '@zhead/schema-vue'
import type { MaybeComputedRef } from '@vueuse/shared'
import type { RawHeadAugmentation } from '@zhead/schema-raw'

export interface HandlesDuplicates {
  /**
   * By default, tags which share the same unique key `name`, `property` are de-duped. To allow duplicates
   * to be made you can provide a unique key for each entry.
   */
  key?: string
  /**
   * @deprecated Use `key` instead
   */
  hid?: string
  /**
   * @deprecated Use `key` instead
   */
  vmid?: string
}

export interface RendersToBody {
  /**
   * Render tag at the end of the <body>.
   */
  body?: boolean
}

export interface HasTextContent {
  /**
   * Sets the textContent of an element.
   *
   * @deprecated Use `textContent` instead.
   */
  children?: string
  /**
   * Sets the textContent of an element. This will be HTML encoded.
   */
  textContent?: string
}

export interface HasRenderPriority {
  /**
   * The priority for rendering the tag, without this all tags are rendered as they are registered
   * (besides some special tags).
   *
   * The following special tags have default priorities:
   * * -2 <meta charset ...>
   * * -1 <base>
   * * 0 <meta http-equiv="content-security-policy" ...>
   *
   * All other tags have a default priority of 10: <meta>, <script>, <link>, <style>, etc
   *
   * @warn Experimental feature. Only available when rendering SSR
   */
  renderPriority?: number
}

export type Never<T> = {
  [P in keyof T]?: never
}

export interface VueUseHeadSchema extends MergeHead {
  base: Never<HandlesDuplicates & HasTextContent & HasRenderPriority & RendersToBody>
  link: HasRenderPriority & RendersToBody & Never<HasTextContent & HandlesDuplicates>
  meta: HasRenderPriority &
  HandlesDuplicates & Never<HasTextContent & RendersToBody>
  style: HasRenderPriority &
  RendersToBody &
  HasTextContent & Never<HandlesDuplicates>
  script: HasRenderPriority &
  RendersToBody &
  HasTextContent &
  HandlesDuplicates
  noscript: HasRenderPriority &
  RendersToBody &
  HasTextContent & Never<HandlesDuplicates>
  htmlAttrs: Never<HandlesDuplicates & HasTextContent & HasRenderPriority & RendersToBody>
  bodyAttrs: Never<HandlesDuplicates & HasTextContent & HasRenderPriority & RendersToBody>
}

export type HeadObjectPlain<T extends MergeHead = {}> = PlainHead<T & VueUseHeadSchema>
export type HeadObject<T extends MergeHead = {}> = ReactiveHead<T & VueUseHeadSchema>
export type UseHeadInput<T extends MergeHead = {}> = MaybeComputedRef<HeadObject<T>>
export type UseHeadRawInput = MaybeComputedRef<ReactiveHead<RawHeadAugmentation & VueUseHeadSchema>>

export interface HeadEntryOptions { raw?: boolean }

export interface HeadEntry<T extends MergeHead = {}> { options?: HeadEntryOptions; input: UseHeadInput<T>; id?: number }
export interface ResolvedHeadEntry<T extends MergeHead = {}> { options?: HeadEntryOptions; input: PlainHead<T & VueUseHeadSchema> }

export type TagKeys = keyof Omit<HeadObjectPlain, 'titleTemplate'>
