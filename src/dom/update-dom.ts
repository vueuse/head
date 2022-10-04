import type { DomUpdateCtx } from '../types'
import { setAttrs } from './utils'
import { updateElements } from './update-elements'

export const updateDOM = ({ domCtx, document, previousTags }: { previousTags: Set<string>; domCtx: DomUpdateCtx; document?: typeof window.document }) => {
  if (!document)
    document = window.document
  if (domCtx.title !== undefined)
    document.title = domCtx.title

  setAttrs(document.documentElement, domCtx.htmlAttrs)
  setAttrs(document.body, domCtx.bodyAttrs)
  const tags = new Set([...Object.keys(domCtx.actualTags), ...previousTags])
  for (const tag of tags)
    updateElements(document, tag, domCtx.actualTags[tag] || [])

  previousTags.clear()
  Object.keys(domCtx.actualTags).forEach(i => previousTags.add(i))
}
