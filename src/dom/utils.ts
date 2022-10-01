// Shamelessly taken from Next.js
import { HEAD_ATTRS_KEY } from '../constants'
import type { HeadAttrs } from '../index'

export function isEqualNode(oldTag: Element, newTag: Element) {
  if (oldTag instanceof HTMLElement && newTag instanceof HTMLElement) {
    const nonce = newTag.getAttribute('nonce')
    // Only strip the nonce if `oldTag` has had it stripped. An element's nonce attribute will not
    // be stripped if there is no content security policy response header that includes a nonce.
    if (nonce && !oldTag.getAttribute('nonce')) {
      const cloneTag = newTag.cloneNode(true) as typeof newTag
      cloneTag.setAttribute('nonce', '')
      cloneTag.nonce = nonce
      return nonce === oldTag.nonce && oldTag.isEqualNode(cloneTag)
    }
  }

  return oldTag.isEqualNode(newTag)
}

export const setAttrs = (el: Element, attrs: HeadAttrs) => {
  const existingAttrs = el.getAttribute(HEAD_ATTRS_KEY)
  if (existingAttrs) {
    for (const key of existingAttrs.split(',')) {
      if (!(key in attrs))
        el.removeAttribute(key)
    }
  }

  const keys: string[] = []

  for (const key in attrs) {
    const value = attrs[key]
    if (value == null)
      continue

    if (value === false)
      el.removeAttribute(key)
    else
      el.setAttribute(key, value)

    keys.push(key)
  }

  if (keys.length)
    el.setAttribute(HEAD_ATTRS_KEY, keys.join(','))
  else
    el.removeAttribute(HEAD_ATTRS_KEY)
}
