import { BODY_TAG_ATTR_NAME } from '../constants'
import type { HeadTag } from '../'

export const createElement = (
  tag: HeadTag,
  document: Document,
) => {
  const $el = document.createElement(tag.tag)

  Object.entries(tag.props).forEach(([k, v]) => {
    if (v !== false)
      $el.setAttribute(k, v)
  })

  if (tag.options.body === true) {
    // set meta-body attribute to add the tag before </body>
    $el.setAttribute(BODY_TAG_ATTR_NAME, 'true')
  }

  if (tag.children)
    $el[tag.options.raw ? 'innerHTML' : 'textContent'] = tag.children

  return $el
}
