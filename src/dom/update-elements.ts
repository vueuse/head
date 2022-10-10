import { BODY_TAG_ATTR_NAME, HEAD_COUNT_KEY } from '../constants'
import type { HeadTag } from '../index'
import { isEqualNode } from './utils'
import { createElement } from './create-element'

export const updateElements = (
  document = window.document,
  type: string,
  tags: HeadTag[],
) => {
  const head = document.head
  const body = document.body
  let headCountEl = head.querySelector(`meta[name="${HEAD_COUNT_KEY}"]`)
  const bodyMetaElements = body.querySelectorAll(`[${BODY_TAG_ATTR_NAME}]`)
  const headCount = headCountEl
    ? Number(headCountEl.getAttribute('content'))
    : 0
  const oldHeadElements: Element[] = []
  const oldBodyElements: Element[] = []

  if (bodyMetaElements) {
    for (let i = 0; i < bodyMetaElements.length; i++) {
      if (
        bodyMetaElements[i]
        && bodyMetaElements[i].tagName?.toLowerCase() === type
      )
        oldBodyElements.push(bodyMetaElements[i])
    }
  }
  if (headCountEl) {
    for (
      let i = 0, j = headCountEl.previousElementSibling;
      i < headCount;
      i++, j = j?.previousElementSibling || null
    ) {
      if (j?.tagName?.toLowerCase() === type)
        oldHeadElements.push(j)
    }
  }
  else {
    headCountEl = document.createElement('meta')
    headCountEl.setAttribute('name', HEAD_COUNT_KEY)
    headCountEl.setAttribute('content', '0')
    head.append(headCountEl)
  }
  let newElements = tags.map(tag => ({
    element: createElement(tag, document),
    body: tag._runtime.body ?? false,
  }))

  newElements = newElements.filter((newEl) => {
    for (let i = 0; i < oldHeadElements.length; i++) {
      const oldEl = oldHeadElements[i]
      if (isEqualNode(oldEl, newEl.element)) {
        oldHeadElements.splice(i, 1)
        return false
      }
    }
    for (let i = 0; i < oldBodyElements.length; i++) {
      const oldEl = oldBodyElements[i]
      if (isEqualNode(oldEl, newEl.element)) {
        oldBodyElements.splice(i, 1)
        return false
      }
    }
    return true
  })

  oldBodyElements.forEach(t => t.parentNode?.removeChild(t))
  oldHeadElements.forEach(t => t.parentNode?.removeChild(t))
  newElements.forEach((t) => {
    if (t.body === true)
      body.insertAdjacentElement('beforeend', t.element)
    else
      head.insertBefore(t.element, headCountEl)
  })
  headCountEl.setAttribute(
    'content',
    `${
      headCount
      - oldHeadElements.length
      + newElements.filter(t => !t.body).length}`,
  )
}
