import type { MergeHead } from '@zhead/schema'
import type { HTMLResult, HeadAttrs, HeadEntry, HeadTag } from '../types'
import { BODY_TAG_ATTR_NAME, HEAD_ATTRS_KEY, HEAD_COUNT_KEY, SELF_CLOSING_TAGS } from '../constants'
import type { HeadClient } from '../index'
import {
  escapeHtml,
  escapeJS,
  resolveHeadEntriesToTags,
  resolveUnrefHeadInput,
  sanitiseAttrName,
  sanitiseAttrValue,
} from '../index'
import { sanitiseAttrs } from './stringify-attrs'

export * from './stringify-attrs'

export const tagToString = (tag: HeadTag) => {
  const body = tag.options?.body ? ` ${BODY_TAG_ATTR_NAME}="true"` : ''
  const attrs = sanitiseAttrs(tag.props, tag.options?.safe || false)
  if (SELF_CLOSING_TAGS.includes(tag.tag))
    return `<${tag.tag}${attrs}${body}>`

  let children = ''
  if (tag.options?.safe) {
    if (tag.tag !== 'script')
      children = escapeJS(escapeHtml(children))
  }
  else {
    children = tag.children || children
  }
  return `<${tag.tag}${attrs}${body}>${children}</${tag.tag}>`
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

  const resolvedEntries = resolveHeadEntries(head.headEntries)

  for (const h in head.hooks['resolved:entries'])
    await head.hooks['resolved:entries'][h](resolvedEntries)

  const headTags = resolveHeadEntriesToTags(resolvedEntries)

  for (const h in head.hooks['resolved:tags'])
    await head.hooks['resolved:tags'][h](headTags)

  for (const tag of headTags) {
    if (tag.tag === 'title') { titleHtml = tagToString(tag) }
    else if (tag.tag === 'htmlAttrs' || tag.tag === 'bodyAttrs') {
      for (const k in tag.props) {
        // always encode name to avoid html errors
        attrs[tag.tag][sanitiseAttrName(k)] = sanitiseAttrValue(tag.props[k])
      }
    }
    else if (tag.options?.body) { bodyHtml.push(tagToString(tag)) }
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
      return sanitiseAttrs({
        ...attrs.htmlAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(attrs.htmlAttrs).join(','),
      },
      // values have already been encoded if they are not raw
      false,
      )
    },
    get bodyAttrs() {
      return sanitiseAttrs({
        ...attrs.bodyAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(attrs.bodyAttrs).join(','),
      },
      // values have already been encoded if they are not raw
      false,
      )
    },
    get bodyTags() {
      return bodyHtml.join('')
    },
  }
}
