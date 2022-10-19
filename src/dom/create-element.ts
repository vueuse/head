import type { HeadTag } from '../'

export const createElement = (
  tag: HeadTag,
  document: Document,
) => {
  const $el = document.createElement(tag.tag)

  Object.entries(tag.props).forEach(([k, v]) => {
    if (v !== false) {
      // ensure boolean values are set as empty to avoid ssr mismatch
      $el.setAttribute(k, v === true ? '' : String(v))
    }
  })

  if (tag.children) {
    if (tag.options?.safe) {
      // script is not safe with textContent
      if (tag.tag !== 'script')
        $el.textContent = tag.children
    }
    else {
      $el.innerHTML = tag.children
    }
  }

  return $el
}
