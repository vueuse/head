import type { HeadClient } from '../index'
import { resolveHeadEntries, resolveHeadEntriesToTags } from '../index'
import type { HeadTag } from '../types'
import { setAttrs } from './utils'
import { updateElements } from './update-elements'

export const updateDOM = async (head: HeadClient, previousTags: Set<string>, document?: typeof window.document) => {
  const tagElements: Record<string, HeadTag[]> = {}

  if (!document)
    document = window.document

  const ctx = {
    render: true,
    previousTags,
  }

  await head.hooks.callHook('before:dom', ctx)
  // allow integration to disable dom update and / or modify it
  if (!ctx.render)
    return

  const resolvedEntries = resolveHeadEntries(head.entries)

  await head.hooks.callHook('resolved:entries', resolvedEntries)

  const tags = resolveHeadEntriesToTags(resolvedEntries)

  await head.hooks.callHook('resolved:tags', tags)

  // head sorting here is not guaranteed to be honoured
  for (const tag of tags) {
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
        tagElements[tag.tag] = tagElements[tag.tag] || []
        tagElements[tag.tag].push(tag)
        break
    }
  }

  setAttrs(document.documentElement, headTags.find(t => t.tag === 'htmlAttrs')?.props || {})
  setAttrs(document.body, headTags.find(t => t.tag === 'bodyAttrs')?.props || {})
  const tagKeys = new Set([...Object.keys(tags), ...previousTags])
  for (const tagName of tagKeys)
    updateElements(document, tagName, tagElements[tagName] || [])
  previousTags.clear()
  Object.keys(tags).forEach(i => previousTags.add(i))
}
