import type { Head as PlainHead, ReactiveHead } from "@zhead/schema-vue"

interface Dedupes {
  /**
   * Key used to dedupe the link tags.
   */
  key?: string
}

interface RendersToBody {
  /**
   * Used to render script in the body of the document
   */
  body?: boolean
}

interface RendersInnerContent {
  /**
   * Content of the script tag
   */
  children?: string
}

interface HeadAugmentations {
  // Note: base does not need de-duping, only a single base is supported so should always dedupe
  /**
   * The <link> HTML element specifies relationships between the current document and an external resource.
   * This element is most commonly used to link to stylesheets, but is also used to establish site icons
   * (both "favicon" style icons and icons for the home screen and apps on mobile devices) among other things.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#attr-as
   */
  link: Dedupes & RendersToBody & { children?: never }
  /**
   * The <meta> element represents metadata that cannot be expressed in other HTML elements, like <link> or <script>.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
   */
  meta: Dedupes & { children?: never; body?: never }
  /**
   * The <style> HTML element contains style information for a document, or part of a document.
   * It contains CSS, which is applied to the contents of the document containing the <style> element.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
   */
  style: Dedupes & RendersToBody & RendersInnerContent
  /**
   * The <script> HTML element is used to embed executable code or data; this is typically used to embed or refer to JavaScript code.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
   */
  script: Dedupes & RendersToBody & RendersInnerContent
  /**
   * The <noscript> HTML element defines a section of HTML to be inserted if a script type on the page is unsupported
   * or if scripting is currently turned off in the browser.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript
   */
  noscript: Dedupes & RendersToBody & RendersInnerContent
  /**
   * Attributes for the <html> HTML element.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html
   */
  htmlAttrs: Dedupes & { children?: never; body?: never }
  /**
   * Attributes for the <body> HTML element.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body
   */
  bodyAttrs: Dedupes & { children?: never; body?: never }
}

export type HeadObjectPlain = PlainHead<HeadAugmentations>
export type HeadObject = ReactiveHead<HeadAugmentations>
export type TagKeys = keyof Omit<HeadObjectPlain, "titleTemplate">
