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
  const body = tag._runtime.body ? ` ${BODY_TAG_ATTR_NAME}="true"` : ''
  const attrs = stringifyAttrs(tag.props, tag._runtime)
  if (SELF_CLOSING_TAGS.includes(tag.tag))
    return `<${tag.tag}${attrs}${body}>`

  let innerContent = ''

  if (tag._runtime?.raw && tag._runtime.innerHTML)
    innerContent = tag._runtime.innerHTML

  if (!innerContent && tag._runtime.textContent)
    innerContent = escapeJS(escapeHtml(tag._runtime.textContent))

  if (!innerContent && tag._runtime.children)
    /*
     * DOM updates is using textContent which doesn't allow HTML or JS already, so SSR needs to match
     *
     * @see https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html#rule-1-html-escape-then-javascript-escape-before-inserting-untrusted-data-into-html-subcontext-within-the-execution-context
     */
    innerContent = escapeJS(escapeHtml(tag._runtime.children))

  return `<${tag.tag}${attrs}${body}>${innerContent}</${tag.tag}>`
}

export const resolveHeadEntries = (entries: HeadEntry[], force?: boolean) => {
  return entries.map((e) => {
    // when SSR we need to re-resolve the input each time on demand
    if (e.input && (force || !e.resolved))
      e.input = resolveUnrefHeadInput(e.input)
    return e
  })
}

export const renderHeadToString = async <T extends MergeHead = {}>(head: HeadClient<T>): Promise<HTMLResult> => {
  const headHtml: string[] = []
  const bodyHtml: string[] = []
  let titleHtml = ''
  const attrs: { htmlAttrs: HeadAttrs; bodyAttrs: HeadAttrs } = { htmlAttrs: {}, bodyAttrs: {} }

  const resolvedEntries = resolveHeadEntries(head.entries, true)

  await head.hooks.callHook('resolved:entries', resolvedEntries)

  const tags = resolveHeadEntriesToTags(resolvedEntries)

  await head.hooks.callHook('resolved:tags', tags)

  for (const tag of tags) {
    if (tag.tag === 'title') { titleHtml = tagToString(tag) }
    else if (tag.tag === 'htmlAttrs' || tag.tag === 'bodyAttrs') {
      for (const k in tag.props) {
        // always encode name to avoid html errors
        attrs[tag.tag][stringifyAttrName(k)] = stringifyAttrValue(tag.props[k])
      }
    }
    else if (tag._runtime.body) { bodyHtml.push(tagToString(tag)) }
    else {
      headHtml.push(tagToString(tag))
    }
  }
  headHtml.push(`<meta name="${HEAD_COUNT_KEY}" content="${headHtml.length}">`)

  return {
    get headTags() {
      return titleHtml + headHtml.join('')
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
      return bodyHtml.join('')
    },
  }
}
