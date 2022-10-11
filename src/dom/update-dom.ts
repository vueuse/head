import type { HeadClient } from '../index'
import { resolveHeadEntriesToTags } from '../index'
import type { HeadTag } from '../types'
import { setAttrs } from './utils'
import { updateElements } from './update-elements'

export const updateDOM = async (head: HeadClient, previousTags: Set<string>, document?: typeof window.document) => {
  const tags: Record<string, HeadTag[]> = {}

  if (!document)
    document = window.document

  const headTags = resolveHeadEntriesToTags(head.headEntries)
  for (const h in head.hookTagsResolved)
    await head.hookTagsResolved[h](headTags)

  // allow integration to disable dom update and / or modify it
  for (const k in head.hookBeforeDomUpdate) {
    if (await head.hookBeforeDomUpdate[k](headTags) === false)
      return
  }

  // head sorting here is not guaranteed to be honoured
  for (const tag of headTags) {
    switch (tag.tag) {
      case 'title':
        if (typeof tag.children !== 'undefined')
          document.title = tag.children
        break

      case 'base':
      case 'meta':
      case 'link':
      case 'style':
      case 'script':
      case 'noscript':
        tags[tag.tag] = tags[tag.tag] || []
        tags[tag.tag].push(tag)
        break
    }
  }

  setAttrs(document.documentElement, headTags.find(t => t.tag === 'htmlAttrs')?.props || {})
  setAttrs(document.body, headTags.find(t => t.tag === 'bodyAttrs')?.props || {})
  const tagKeys = new Set([...Object.keys(tags), ...previousTags])
  for (const tag of tagKeys)
    updateElements(document, tag, tags[tag] || [])
  previousTags.clear()
  Object.keys(tags).forEach(i => previousTags.add(i))
}
