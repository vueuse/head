import type { Head as PlainHead, ReactiveHead } from "@zhead/schema-vue"

export interface HandlesDuplicates {
  /**
   * By default, tags which share the same unique key `name, `property` are de-duped. To allow duplicates
   * to be made you can provide a unique key for each entry.
   */
  key?: string
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

export interface HeadAugmentations {
  base: { key?: never; body?: never; children?: never }
  link: RendersToBody & { key?: never; children?: never }
  meta: HandlesDuplicates & { children?: never; body?: never }
  style: RendersToBody & RendersInnerContent & { key?: never }
  script: RendersToBody & RendersInnerContent & HandlesDuplicates
  noscript: RendersToBody & RendersInnerContent & { key?: never }
  htmlAttrs: { key?: never; children?: never; body?: never }
  bodyAttrs: { key?: never; children?: never; body?: never }
}

export type HeadObjectPlain = PlainHead<HeadAugmentations>
export type HeadObject = ReactiveHead<HeadAugmentations>
export type TagKeys = keyof Omit<HeadObjectPlain, "titleTemplate">
