import type { HTMLResult, HeadAttrs, HeadTag } from '../types'
import { BODY_TAG_ATTR_NAME, HEAD_ATTRS_KEY, HEAD_COUNT_KEY, SELF_CLOSING_TAGS } from '../constants'
import type { HeadClient } from '../index'
import { escapeHtml, escapeJS, sortTags } from '../index'
import { stringifyAttrs } from './stringify-attrs'

export * from './stringify-attrs'

export const tagToString = (tag: HeadTag) => {
  let isBodyTag = false
  if (tag.props.body) {
    isBodyTag = true
    // avoid rendering body attr
    delete tag.props.body
  }
  if (tag.props.renderPriority)
    delete tag.props.renderPriority

  const attrs = stringifyAttrs(tag.props)
  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}${
      isBodyTag ? ' ' + ` ${BODY_TAG_ATTR_NAME}="true"` : ''
    }>`
  }

  let innerContent = ''

  if (!innerContent && tag.props.children) {
    /*
     * DOM updates is using textContent which doesn't allow HTML or JS already, so SSR needs to match
     *
     * @see https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html#rule-1-html-escape-then-javascript-escape-before-inserting-untrusted-data-into-html-subcontext-within-the-execution-context
     */
    innerContent = escapeJS(escapeHtml(tag.props.children))
  }

  return `<${tag.tag}${attrs}${
    isBodyTag ? ` ${BODY_TAG_ATTR_NAME}="true"` : ''
  }>${innerContent}</${tag.tag}>`
}

export const renderHeadToString = (head: HeadClient): HTMLResult => {
  const tags: string[] = []
  let titleTag = ''
  const htmlAttrs: HeadAttrs = {}
  const bodyAttrs: HeadAttrs = {}
  const bodyTags: string[] = []

  for (const tag of head.headTags.sort(sortTags)) {
    if (tag.tag === 'title')
      titleTag = tagToString(tag)
    else if (tag.tag === 'htmlAttrs')
      Object.assign(htmlAttrs, tag.props)
    else if (tag.tag === 'bodyAttrs')
      Object.assign(bodyAttrs, tag.props)
    else if (tag.props.body)
      bodyTags.push(tagToString(tag))
    else
      tags.push(tagToString(tag))
  }
  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}">`)

  return {
    get headTags() {
      return titleTag + tags.join('')
    },
    get htmlAttrs() {
      return stringifyAttrs({
        ...htmlAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(htmlAttrs).join(','),
      })
    },
    get bodyAttrs() {
      return stringifyAttrs({
        ...bodyAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(bodyAttrs).join(','),
      })
    },
    get bodyTags() {
      return bodyTags.join('')
    },
  }
}
