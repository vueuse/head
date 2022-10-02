import type { Head as PlainHead, ReactiveHead } from '@zhead/schema-vue'
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

export interface RendersInnerContent {
  /**
   * Sets the textContent of an element.
   */
  children?: string
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

export interface HeadAugmentations {
  base: Never<HandlesDuplicates & RendersInnerContent & HasRenderPriority & RendersToBody>
  link: HasRenderPriority & RendersToBody & Never<RendersInnerContent & HandlesDuplicates>
  meta: HasRenderPriority &
  HandlesDuplicates & Never<RendersInnerContent & RendersToBody>
  style: HasRenderPriority &
  RendersToBody &
  RendersInnerContent & Never<HandlesDuplicates>
  script: HasRenderPriority &
  RendersToBody &
  RendersInnerContent &
  HandlesDuplicates
  noscript: HasRenderPriority &
  RendersToBody &
  RendersInnerContent & Never<HandlesDuplicates>
  htmlAttrs: Never<HandlesDuplicates & RendersInnerContent & HasRenderPriority & RendersToBody>
  bodyAttrs: Never<HandlesDuplicates & RendersInnerContent & HasRenderPriority & RendersToBody>
}

export type HeadObjectPlain = PlainHead<HeadAugmentations>
export type HeadObject = ReactiveHead<HeadAugmentations>
export type TagKeys = keyof Omit<HeadObjectPlain, 'titleTemplate'>
export type UseHeadInput = MaybeComputedRef<HeadObject>

