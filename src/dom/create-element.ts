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

  if (tag._runtime.body === true) {
    // set meta-body attribute to add the tag before </body>
    $el.setAttribute(BODY_TAG_ATTR_NAME, 'true')
  }

  if (tag._runtime.raw && tag._runtime.innerHTML)
    $el.innerHTML = tag._runtime.innerHTML
  else
    $el.textContent = tag._runtime.textContent || tag._runtime.children || ''

  return $el
}
