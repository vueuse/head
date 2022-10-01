import type { HeadTag } from './index'

export const sortTags = (aTag: HeadTag, bTag: HeadTag) => {
  const tagWeight = (tag: HeadTag) => {
    if (tag.props.renderPriority)
      return tag.props.renderPriority

    switch (tag.tag) {
      // This element must come before other elements with attribute values of URLs
      case 'base':
        return -1
      case 'meta':
        // charset must come early in case there's non-utf8 characters in the HTML document
        if (tag.props.charset)
          return -2

        // CSP needs to be as it effects the loading of assets
        if (tag.props['http-equiv'] === 'content-security-policy')
          return 0

        return 10
      default:
        // arbitrary safe number that can go up and down without conflicting
        return 10
    }
  }
  return tagWeight(aTag) - tagWeight(bTag)
}

export const tagDedupeKey = <T extends HeadTag>(tag: T) => {
  // only meta, base and script tags will be deduped
  if (!['meta', 'base', 'script', 'link'].includes(tag.tag))
    return false

  const { props, tag: tagName } = tag
  // must only be a single base so we always dedupe
  if (tagName === 'base')
    return 'base'

  // support only a single canonical
  if (tagName === 'link' && props.rel === 'canonical')
    return 'canonical'

  // must only be a single charset
  if (props.charset)
    return 'charset'

  const name = ['key', 'id', 'name', 'property', 'http-equiv']
  for (const n of name) {
    let value
    // Probably an HTML Element
    if (typeof props.getAttribute === 'function' && props.hasAttribute(n))
      value = props.getAttribute(n)
    else
      value = props[n]

    if (value !== undefined) {
      // for example: meta-name-description
      return `${tagName}-${n}-${value}`
    }
  }
  return false
}
