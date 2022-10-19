import type { HeadTag } from '../'
import { sanitiseAttrName, sanitiseAttrValue } from '../encoding'

export const createElement = (
  tag: HeadTag,
  document: Document,
) => {
  const $el = document.createElement(tag.tag)

  Object.entries(tag.props).forEach(([k, v]) => {
    if (v !== false) {
      // ensure the values are sanitised, so we can match with SSR results
      // ensure boolean values are set as empty
      $el.setAttribute(sanitiseAttrName(k), v === true ? '' : sanitiseAttrValue(String(v)))
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
