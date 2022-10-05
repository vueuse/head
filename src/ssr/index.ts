import type { HTMLResult, HeadAttrs, HeadTag } from '../types'
import { BODY_TAG_ATTR_NAME, HEAD_ATTRS_KEY, HEAD_COUNT_KEY, SELF_CLOSING_TAGS } from '../constants'
import type { HeadClient } from '../index'
import { escapeHtml, escapeJS, sortTags, stringifyAttrName, stringifyAttrValue } from '../index'
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

  const attrs = stringifyAttrs(tag.props, tag._options)
  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}${
      isBodyTag ? ' ' + ` ${BODY_TAG_ATTR_NAME}="true"` : ''
    }>`
  }

  let innerContent = ''

  if (tag._options?.raw && tag.props.innerHTML)
    innerContent = tag.props.innerHTML

  if (!innerContent && tag.props.textContent)
    innerContent = escapeJS(escapeHtml(tag.props.textContent))

  // children is deprecated
  if (!innerContent && tag.props.children) {
    if (tag.tag === 'script') {
      if (tag._options?.raw)
        console.warn('[@vueuse/head] Warning, you must use `innerHTML` with `useHeadRaw` instead of `children` for script content.', tag)
      else
        console.warn('[@vueuse/head] Warning, you must use `useHeadRaw` with `innerHTML` for script content. See https://github.com/vueuse/head/pull/118', tag)
    }
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
  const bodyTags: string[] = []
  let titleTag = ''
  const attrs: { htmlAttrs: HeadAttrs; bodyAttrs: HeadAttrs } = { htmlAttrs: {}, bodyAttrs: {} }

  for (const tag of head.headTags.sort(sortTags)) {
    if (tag.tag === 'title') { titleTag = tagToString(tag) }
    else if (tag.tag === 'htmlAttrs' || tag.tag === 'bodyAttrs') {
      for (const k in tag.props) {
        const keyName = stringifyAttrName(k)
        // always encode name to avoid html errors
        attrs[tag.tag][keyName] = tag._options?.raw ? tag.props[keyName] : tag.props[stringifyAttrValue(keyName)]
      }
    }
    else if (tag.props.body) { bodyTags.push(tagToString(tag)) }
    else { tags.push(tagToString(tag)) }
  }
  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}">`)

  return {
    get headTags() {
      return titleTag + tags.join('')
    },
    get htmlAttrs() {
      return stringifyAttrs({
        ...attrs.htmlAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(attrs.htmlAttrs).join(','),
      },
      // values have already been encoded if they are not raw
      { raw: true },
      )
    },
    get bodyAttrs() {
      return stringifyAttrs({
        ...attrs.bodyAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(attrs.bodyAttrs).join(','),
      },
      // values have already been encoded if they are not raw
      { raw: true },
      )
    },
    get bodyTags() {
      return bodyTags.join('')
    },
  }
}
