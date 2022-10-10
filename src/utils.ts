import { resolveUnref } from '@vueuse/shared'
import { unref } from 'vue'
import type { MergeHead } from '@zhead/schema'
import type { HeadEntry, HeadObjectPlain, HeadTag, ResolvedUseHeadInput, UseHeadInput } from './types'
import { resolveHeadEntry } from './ssr'

export const sortTags = (aTag: HeadTag, bTag: HeadTag) => {
  const tagWeight = (tag: HeadTag) => {
    if (tag.props.renderPriority)
      return tag.props.renderPriority

    switch (tag.tag) {
      // This element must come before other elements with attribute values of URLs
      case 'base':
        return -1
      case 'meta':
        // charset must come early in case there's non-utf8 characters in the HTML document
        if (tag.props.charset)
          return -2
        // CSP needs to be as it effects the loading of assets
        if (tag.props['http-equiv'] === 'content-security-policy')
          return 0
        return 10
      default:
        // arbitrary safe number that can go up and down without conflicting
        return 10
    }
  }
  return tagWeight(aTag) - tagWeight(bTag)
}

export const tagDedupeKey = <T extends HeadTag>(tag: T) => {
  const { props, tag: tagName } = tag
  // must only be a single base so we always dedupe
  if (tagName === 'base' || tagName === 'title')
    return tagName

  // support only a single canonical
  if (tagName === 'link' && props.rel === 'canonical')
    return 'canonical'

  // must only be a single charset
  if (props.charset)
    return 'charset'

  const name = ['key', 'id']
  if (tagName === 'meta')
    name.push(...['name', 'property', 'http-equiv'])

  for (const n of name) {
    if (typeof props[n] !== 'undefined') {
      // for example: meta-name-description
      return `${tagName}-${n}-${props[n]}`
    }
  }
  return tag._position!
}

export function resolveUnrefHeadInput<T extends MergeHead = {}>(ref: UseHeadInput<T>): ResolvedUseHeadInput<T> {
  const root = resolveUnref(ref)
  if (!ref || !root) {
    // @ts-expect-error recursion untyped
    return root
  }

  if (Array.isArray(root)) {
    // @ts-expect-error recursion untyped
    return root.map(resolveUnrefHeadInput)
  }

  if (typeof root === 'object') {
    return Object.fromEntries(
      Object.entries(root).map(([key, value]) => {
        // title template must stay a function, we support a ref'd string though
        if (key === 'titleTemplate')
          return [key, unref(value)]

        return [
          key,
          resolveUnrefHeadInput(value),
        ]
      }),
    )
  }
  return root
}

const resolveTag = (tag: HeadTag, e: HeadEntry): HeadTag => {
  const legacyDedupeKeys = ['hid', 'vmid']
  legacyDedupeKeys.forEach((key) => {
    if (tag.props[key]) {
      tag.props.key = tag.props[key]
      delete tag.props[key]
    }
  })
  // avoid untrusted data providing their own options key (fixes XSS)
  if (tag._options)
    delete tag._options
  // tag inherits options from useHead registration
  if (e.options)
    tag._options = e.options
  return tag
}

export const headInputToTags = (e: HeadEntry) => {
  return Object.entries(e.input)
    .filter(([k, v]) => typeof v !== 'undefined' && v !== null && k !== 'titleTemplate')
    .map(([key, value]) => {
      return (Array.isArray(value) ? value : [value]).map((props) => {
        switch (key) {
          case 'title':
            return resolveTag({ tag: key, props: { textContent: props } }, e)
          case 'base':
          case 'meta':
          case 'link':
          case 'style':
          case 'script':
          case 'noscript':
          case 'htmlAttrs':
          case 'bodyAttrs':
            // unref item to support ref array entries
            return resolveTag({ tag: key, props }, e)
          default:
            return false
        }
      })
    })
    .flat()
    .filter(v => !!v) as HeadTag[]
}

const renderTitleTemplate = (
  template: Required<HeadObjectPlain>['titleTemplate'],
  title?: string,
): string => {
  if (template == null)
    return ''
  if (typeof template === 'function')
    return template(title)

  return template.replace('%s', title ?? '')
}

export const resolveHeadEntriesToTags = (entries: HeadEntry[]) => {
  const deduping: Record<string, HeadTag> = {}

  const resolvedEntries = resolveHeadEntry(entries)

  const titleTemplate = resolvedEntries
    .map(i => i.input.titleTemplate)
    .reverse()
    .find(i => i != null)

  resolvedEntries.forEach((entry, entryIndex) => {
    const tags = headInputToTags(entry)
    tags.forEach((tag, tagIdx) => {
      // used to restore the order after deduping
      // a large number is needed otherwise the position will potentially duplicate (this support 10k tags)
      // ideally we'd use the total tag count but this is too hard to calculate with the current reactivity
      tag._position = entryIndex * 10000 + tagIdx

      // resolve titles
      if (titleTemplate && tag.tag === 'title') {
        tag.props.textContent = renderTitleTemplate(
          titleTemplate,
          tag.props.textContent,
        )
      }
      // validate XSS vectors for non-raw input
      if (!tag._options?.raw) {
        for (const k in tag.props) {
          if (k.startsWith('on') || k === 'innerHTML')
            delete tag.props[k]
        }
      }

      // Remove tags with the same key
      deduping[tagDedupeKey(tag)] = tag
    })
  })

  return Object.values(deduping)
    .sort((a, b) => a._position! - b._position!)
    .sort(sortTags)
}
