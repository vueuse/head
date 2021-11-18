// Shamelessly taken from Next.js
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
