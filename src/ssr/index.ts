import type { MergeHead } from '@zhead/schema'
import type { HTMLResult, HeadAttrs, HeadEntry, HeadTag } from '../types'
import { HEAD_ATTRS_KEY, HEAD_COUNT_KEY, SELF_CLOSING_TAGS } from '../constants'
import type { HeadClient } from '../index'
import {
  resolveHeadEntriesToTags,
  resolveUnrefHeadInput,
} from '../index'
import { sanitiseAttrName, sanitiseAttrValue } from '../encoding'

export const propsToString = (props: HeadTag['props']) => {
  const handledAttributes = []

  for (const [key, value] of Object.entries(props)) {
    if (value === false || value == null)
      continue

    let attribute = key

    if (value !== true)
      attribute += `="${String(value).replace(/"/g, '&quot;')}"`

    handledAttributes.push(attribute)
  }

  return handledAttributes.length > 0 ? ` ${handledAttributes.join(' ')}` : ''
}

export const tagToString = (tag: HeadTag) => {
  const attrs = propsToString(tag.props)
  const openTag = `<${tag.tag}${attrs}>`
  return SELF_CLOSING_TAGS.includes(tag.tag) ? openTag : `${openTag}${tag.children || ''}</${tag.tag}>`
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
    if (tag.options?.beforeTagRender)
      tag.options.beforeTagRender(tag)

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
      return propsToString({
        ...attrs.htmlAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(attrs.htmlAttrs).join(','),
      })
    },
    get bodyAttrs() {
      return propsToString({
        ...attrs.bodyAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(attrs.bodyAttrs).join(','),
      })
    },
    get bodyTags() {
      return bodyHtml.join('')
    },
  }
}
