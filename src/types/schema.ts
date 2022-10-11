import type { MergeHead, Head as PlainHead } from '@zhead/schema'
import type { ReactiveHead } from '@zhead/schema-vue'
import type { MaybeComputedRef } from '@vueuse/shared'

export interface HandlesDuplicates {
  /**
   * By default, tags which share the same unique key `name, `property` are de-duped. To allow duplicates
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
   * Text content of the tag.
   *
   * Alias for children
   */
  innerHTML?: string
  /**
   * Sets the textContent of an element.
   */
  children?: string
  /**
   * Sets the textContent of an element. This will be HTML encoded.
   *
   * Alias for children
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
export type ResolvedUseHeadInput<T extends MergeHead = {}> = PlainHead<T & VueUseHeadSchema>

