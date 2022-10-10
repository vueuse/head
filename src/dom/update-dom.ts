import type { DomUpdateCtx } from '../types'
import type { HeadClient } from '../index'
import { resolveHeadEntriesToTags } from '../index'
import { setAttrs } from './utils'
import { updateElements } from './update-elements'

export const updateDOM = async ({ head, document, previousTags }: { head: HeadClient; previousTags: Set<string>;document?: typeof window.document }) => {
  const domCtx: DomUpdateCtx = {
    title: undefined,
    htmlAttrs: {},
    bodyAttrs: {},
    tags: {},
  }

  const headTags = resolveHeadEntriesToTags(head.headEntries)
  for (const h in head.hookTagsResolved)
    await head.hookTagsResolved[h](headTags)

  // head sorting here is not guaranteed to be honoured
  for (const tag of headTags) {
    if (tag.tag === 'title') {
      domCtx.title = tag.props.textContent
      continue
    }
    if (tag.tag === 'htmlAttrs' || tag.tag === 'bodyAttrs') {
      Object.assign(domCtx[tag.tag], tag.props)
      continue
    }

    domCtx.tags[tag.tag] = domCtx.tags[tag.tag] || []
    domCtx.tags[tag.tag].push(tag)
  }

  // allow integration to disable dom update and / or modify it
  for (const k in head.hookBeforeDomUpdate) {
    if (head.hookBeforeDomUpdate[k](domCtx.tags) === false)
      return
  }

  if (!document)
    document = window.document
  if (domCtx.title !== undefined)
    document.title = domCtx.title

  setAttrs(document.documentElement, domCtx.htmlAttrs)
  setAttrs(document.body, domCtx.bodyAttrs)
  const tags = new Set([...Object.keys(domCtx.tags), ...previousTags])
  for (const tag of tags)
    updateElements(document, tag, domCtx.tags[tag] || [])

  previousTags.clear()
  Object.keys(domCtx.tags).forEach(i => previousTags.add(i))
}
