import { resolveUnref } from '@vueuse/shared'
import { unref } from 'vue'
import type { MergeHead } from '@zhead/schema'
import type {
  HeadEntry,
  HeadObjectPlain,
  HeadTag,
  HeadTagOptions,
  ResolvedUseHeadInput,
  TagKeys,
  UseHeadInput,
} from './types'
import { resolveHeadEntries } from './ssr'
import { BODY_TAG_ATTR_NAME } from './constants'

export const sortTags = (aTag: HeadTag, bTag: HeadTag) => {
  const tagWeight = (tag: HeadTag) => {
    if (tag.options?.renderPriority)
      return tag.options.renderPriority

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
  const { props, tag: tagName, options } = tag
  // must only be a single base so we always dedupe
  if (tagName === 'base' || tagName === 'title' || tagName === 'titleTemplate')
    return tagName

  // support only a single canonical
  if (tagName === 'link' && props.rel === 'canonical')
    return 'canonical'

  // must only be a single charset
  if (props.charset)
    return 'charset'

  if (options?.key)
    return `${tagName}:${options.key}`

  const name = ['id']
  if (tagName === 'meta')
    name.push(...['name', 'property', 'http-equiv'])
  for (const n of name) {
    if (typeof props[n] !== 'undefined') {
      // for example: meta-name-description
      return `${tagName}:${n}:${props[n]}`
    }
  }
  return tag.runtime!.position!
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

type HeadTagOptionKeys = (keyof HeadTagOptions)[]

const resolveTag = (name: TagKeys, input: Record<string, any>, e: HeadEntry): HeadTag => {
  const tag: HeadTag = {
    tag: name,
    props: {},
    runtime: {
      entryId: e.id,
    },
    // tag inherits options from useHead registration
    options: {
      ...e.options,
    },
  }
  // dedupe keys
  ;(['hid', 'vmid', 'key'] as HeadTagOptionKeys).forEach((key) => {
    if (input[key]) {
      tag.options!.key = input[key]
      delete input[key]
    }
  })
  // set children key
  ;(['children', 'innerHTML', 'textContent'] as HeadTagOptionKeys)
    .forEach((key) => {
      if (typeof input[key] !== 'undefined') {
        tag.children = input[key]
        delete input[key]
      }
    })
  // set options
  ;(['body', 'renderPriority'] as HeadTagOptionKeys)
    .forEach((key) => {
      if (typeof input[key] !== 'undefined') {
        tag.options![key] = input[key]
        delete input[key]
      }
    })
  if (tag.options?.body)
    input[BODY_TAG_ATTR_NAME] = true

  tag.props = input
  return tag
}

export const headInputToTags = (e: HeadEntry) => {
  return Object.entries(e.input)
    .filter(([, v]) => typeof v !== 'undefined')
    .map(([key, value]) => {
      return (Array.isArray(value) ? value : [value]).map((props) => {
        switch (key) {
          case 'title':
          case 'titleTemplate':
            // titleTemplate is a fake tag so we can dedupe it, this will be removed
            return <HeadTag> {
              tag: key,
              children: props,
              props: {},
              runtime: { entryId: e.id },
              options: e.options,
            }
          case 'base':
          case 'meta':
          case 'link':
          case 'style':
          case 'script':
          case 'noscript':
          case 'htmlAttrs':
          case 'bodyAttrs':
            // unref item to support ref array entries
            return resolveTag(key, props, e)
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
): string | null => {
  if (template == null)
    return title || null
  if (typeof template === 'function')
    return template(title)

  return template.replace('%s', title ?? '')
}

export const resolveHeadEntriesToTags = (entries: HeadEntry[]) => {
  const deduping: Record<string, HeadTag> = {}

  const resolvedEntries = resolveHeadEntries(entries)

  resolvedEntries.forEach((entry, entryIndex) => {
    const tags = headInputToTags(entry)
    tags.forEach((tag, tagIdx) => {
      tag.runtime = tag.runtime || {}
      // used to restore the order after deduping
      // a large number is needed otherwise the position will potentially duplicate (this support 10k tags)
      // ideally we'd use the total tag count but this is too hard to calculate with the current reactivity
      tag.runtime.position = entryIndex * 10000 + tagIdx

      // Remove tags with the same key
      deduping[tagDedupeKey(tag)] = tag
    })
  })

  let resolvedTags = Object.values(deduping)
    .sort((a, b) => a.runtime!.position! - b.runtime!.position!)
    .sort(sortTags)

  // resolve title
  const titleTemplateIdx = resolvedTags.findIndex(i => i.tag === 'titleTemplate')
  const titleIdx = resolvedTags.findIndex(i => i.tag === 'title')
  if (titleIdx !== -1 && titleTemplateIdx !== -1) {
    const newTitle = renderTitleTemplate(
      resolvedTags[titleTemplateIdx].children,
      resolvedTags[titleIdx].children,
    )
    if (newTitle !== null) {
      resolvedTags[titleIdx].children = newTitle || resolvedTags[titleIdx].children
    }
    else {
      // remove the title
      resolvedTags = resolvedTags.filter((_, i) => i !== titleIdx)
    }
    // remove the title template
    resolvedTags = resolvedTags.filter((_, i) => i !== titleTemplateIdx)
  }
  // titleTemplate is set but title is not set, convert to a title
  else if (titleTemplateIdx !== -1) {
    const newTitle = renderTitleTemplate(
      resolvedTags[titleTemplateIdx].children,
    )
    if (newTitle !== null) {
      resolvedTags[titleTemplateIdx].children = newTitle
      resolvedTags[titleTemplateIdx].tag = 'title'
    }
    else {
      // remove the title template
      resolvedTags = resolvedTags.filter((_, i) => i !== titleTemplateIdx)
    }
  }

  return resolvedTags
}
