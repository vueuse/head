import { resolveUnref } from '@vueuse/shared'
import { unref } from 'vue'
import type { MergeHead } from '@zhead/schema'
import type { HeadEntry, HeadObjectPlain, HeadTag, ResolvedUseHeadInput, TagKeys, UseHeadInput } from './types'
import { resolveHeadEntry } from './ssr'

const acceptFields: Array<TagKeys> = [
  'title',
  'meta',
  'link',
  'base',
  'style',
  'script',
  'noscript',
  'htmlAttrs',
  'bodyAttrs',
]

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
  // only meta, base and script tags will be deduped
  if (!['meta', 'base', 'script', 'link', 'title'].includes(tag.tag))
    return false

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

  const name = ['key', 'id', 'name', 'property', 'http-equiv']
  for (const n of name) {
    let value
    // Probably an HTML Element
    if (typeof props.getAttribute === 'function' && props.hasAttribute(n))
      value = props.getAttribute(n)
    else
      value = props[n]

    if (value !== undefined) {
      // for example: meta-name-description
      return `${tagName}-${n}-${value}`
    }
  }
  return false
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

export const headEntryToTags = (e: HeadEntry) => {
  const input = e.input
  const tags: HeadTag[] = []
  const keys = Object.keys(input) as Array<keyof HeadObjectPlain>

  const convertLegacyKey = (value: any) => {
    if (value.hid) {
      value.key = value.hid
      delete value.hid
    }
    if (value.vmid) {
      value.key = value.vmid
      delete value.vmid
    }
    return value
  }

  for (const key of keys) {
    if (input[key] == null)
      continue

    switch (key) {
      case 'title':
        tags.push({ tag: key, props: { textContent: input[key] } })
        break
      case 'titleTemplate':
        break
      case 'base':
        tags.push({ tag: key, props: { key: 'default', ...input[key] } })
        break
      default:
        if (acceptFields.includes(key)) {
          const value = input[key]
          if (Array.isArray(value)) {
            value.forEach((item) => {
              const props = convertLegacyKey(item)
              // unref item to support ref array entries
              tags.push({ tag: key, props })
            })
          }
          else if (value) {
            tags.push({ tag: key, props: convertLegacyKey(value) })
          }
        }
        break
    }
  }

  return tags.map((tag) => {
    // avoid untrusted data providing their own options key (fixes XSS)
    if (tag._options)
      delete tag._options
    // tag inherits options from useHead registration
    if (e.options)
      tag._options = e.options

    return tag
  })
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
  const deduped: HeadTag[] = []
  const deduping: Record<string, HeadTag> = {}

  const resolvedEntries = resolveHeadEntry(entries)

  const titleTemplate = resolvedEntries
    .map(i => i.input.titleTemplate)
    .reverse()
    .find(i => i != null)

  resolvedEntries.forEach((entry, entryIndex) => {
    const tags = headEntryToTags(entry)
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
      // validate XSS vectors
      if (!tag._options?.raw) {
        for (const k in tag.props) {
          if (k.startsWith('on')) {
            console.warn('[@vueuse/head] Warning, you must use `useHeadRaw` to set event listeners. See https://github.com/vueuse/head/pull/118', tag)
            delete tag.props[k]
          }
        }
        if (tag.props.innerHTML) {
          console.warn('[@vueuse/head] Warning, you must use `useHeadRaw` to use `innerHTML`', tag)
          delete tag.props.innerHTML
        }
      }

      // Remove tags with the same key
      const dedupeKey = tagDedupeKey(tag)
      if (dedupeKey)
        deduping[dedupeKey] = tag
      else
        deduped.push(tag)
    })
  })

  // add the entries we were deduping
  deduped.push(...Object.values(deduping))
  // ensure their original positions are kept
  const tags = deduped.sort((a, b) => a._position! - b._position!)

  return tags.sort(sortTags)
}
