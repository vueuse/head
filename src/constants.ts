export const PROVIDE_KEY = `usehead`
export const HEAD_COUNT_KEY = `head:count`
// Store attr names for `htmlAttrs`, `bodyAttrs` so we can remove them first before next update
export const HEAD_ATTRS_KEY = `data-head-attrs`

export const SELF_CLOSING_TAGS = ["meta", "link", "base"]

export const BODY_TAG_ATTR_NAME = `data-meta-body`

export const RENDER_PRIORITY_FIRST = 1
export const RENDER_PRIORITY_BEFORE_META = 9
export const RENDER_PRIORITY_AFTER_META = 11
export const RENDER_PRIORITY_LAST = 21
