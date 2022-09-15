import type { Head as PlainHead, ReactiveHead } from "@zhead/schema-vue"

interface HandlesDuplicates {
  /**
   * By default, tags which share the same unique key `name, `property` are de-duped. To allow duplicates
   * to be made you can provide a unique key for each entry.
   */
  key?: string
}

interface RendersToBody {
  /**
   * Render tag at the end of the <body>.
   */
  body?: boolean
}

interface RendersInnerContent {
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
   * <meta> tags have a priority of 2 by default and will appear before all other tags (besides <title> and <base>).
   *
   * All other tags have a priority of 100 and will be rendered as they are registered.
   *
   * The following default priorities exist:
   * * -2 <meta charset ...>
   * * -1 <base>
   * * 0 <meta http-equiv="content-security-policy" ...>
   * * 10 <meta>, <script>, <link>, <style>, etc
   *
   * @warn Experimental feature. Only available when rendering SSR
   */
  renderPriority?: number
}

interface HeadAugmentations {
  base: HandlesDuplicates & {
    renderPriority?: never
    body?: never
    children?: never
  }
  link: HasRenderPriority & RendersToBody & { key?: never; children?: never }
  meta: HasRenderPriority &
    HandlesDuplicates & { children?: never; body?: never }
  style: HasRenderPriority &
    RendersToBody &
    RendersInnerContent & { key?: never }
  script: HasRenderPriority &
    RendersToBody &
    RendersInnerContent &
    HandlesDuplicates
  noscript: HasRenderPriority &
    RendersToBody &
    RendersInnerContent & { key?: never }
  htmlAttrs: {
    renderPriority?: never
    key?: never
    children?: never
    body?: never
  }
  bodyAttrs: {
    renderPriority?: never
    key?: never
    children?: never
    body?: never
  }
}

export type HeadObjectPlain = PlainHead<HeadAugmentations>
export type HeadObject = ReactiveHead<HeadAugmentations>
export type TagKeys = keyof Omit<HeadObjectPlain, "titleTemplate">
