import type { MergeHead } from '@zhead/schema'
import type { HTMLResult, HeadAttrs, HeadEntry, HeadTag } from '../types'
import { BODY_TAG_ATTR_NAME, HEAD_ATTRS_KEY, HEAD_COUNT_KEY, SELF_CLOSING_TAGS } from '../constants'
import type { HeadClient } from '../index'
import {
  escapeHtml,
  escapeJS,
  resolveHeadEntriesToTags,
  resolveUnrefHeadInput,
  stringifyAttrName,
  stringifyAttrValue,
} from '../index'
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

  if (!innerContent && tag.props.children)
    /*
     * DOM updates is using textContent which doesn't allow HTML or JS already, so SSR needs to match
     *
     * @see https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html#rule-1-html-escape-then-javascript-escape-before-inserting-untrusted-data-into-html-subcontext-within-the-execution-context
     */
    innerContent = escapeJS(escapeHtml(tag.props.children))

  return `<${tag.tag}${attrs}${
    isBodyTag ? ` ${BODY_TAG_ATTR_NAME}="true"` : ''
  }>${innerContent}</${tag.tag}>`
}

export const resolveHeadEntry = (entries: HeadEntry[], force?: boolean) => {
  return entries.map((e) => {
    // when SSR we need to re-resolve the input each time on demand
    if (e.input && (force || !e.resolved))
      e.input = resolveUnrefHeadInput(e.input)
    return e
  })
}

export const renderHeadToString = async <T extends MergeHead = {}>(head: HeadClient<T>): Promise<HTMLResult> => {
  const tags: string[] = []
  const bodyTags: string[] = []
  let titleTag = ''
  const attrs: { htmlAttrs: HeadAttrs; bodyAttrs: HeadAttrs } = { htmlAttrs: {}, bodyAttrs: {} }

  const resolvedEntries = resolveHeadEntry(head.headEntries, true)
  const headTags = resolveHeadEntriesToTags(resolvedEntries)
  for (const h in head.hookTagsResolved)
    await head.hookTagsResolved[h](headTags)

  for (const tag of headTags) {
    if (tag.tag === 'title') { titleTag = tagToString(tag) }
    else if (tag.tag === 'htmlAttrs' || tag.tag === 'bodyAttrs') {
      for (const k in tag.props) {
        // always encode name to avoid html errors
        attrs[tag.tag][stringifyAttrName(k)] = stringifyAttrValue(tag.props[k])
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
