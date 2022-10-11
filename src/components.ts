import type { Ref, VNode } from 'vue'
import { defineComponent, onBeforeUnmount, ref, watchEffect } from 'vue'
import type { HeadObjectPlain } from './types'
import type { HeadAttrs } from './index'
import { IS_BROWSER, injectHead } from './index'

const addVNodeToHeadObj = (node: VNode, obj: HeadObjectPlain) => {
  const type
    = node.type === 'html'
      ? 'htmlAttrs'
      : node.type === 'body'
        ? 'bodyAttrs'
        : (node.type as keyof HeadObjectPlain)

  if (typeof type !== 'string' || !(type in obj))
    return

  const props: HeadAttrs = node.props || {} as HeadAttrs
  if (node.children) {
    props.children = Array.isArray(node.children)
      // @ts-expect-error untyped
      ? node.children[0]!.children
      : node.children
  }
  if (Array.isArray(obj[type]))
    (obj[type] as HeadAttrs[]).push(props)

  else if (type === 'title')
    obj.title = props.children

  else
    (obj[type] as HeadAttrs) = props
}

const vnodesToHeadObj = (nodes: VNode[]) => {
  const obj: HeadObjectPlain = {
    title: undefined,
    htmlAttrs: undefined,
    bodyAttrs: undefined,
    base: undefined,
    meta: [],
    link: [],
    style: [],
    script: [],
    noscript: [],
  }

  for (const node of nodes) {
    if (typeof node.type === 'symbol' && Array.isArray(node.children)) {
      for (const childNode of node.children)
        addVNodeToHeadObj(childNode as VNode, obj)
    }
    else {
      addVNodeToHeadObj(node, obj)
    }
  }

  return obj
}

export const Head = /* @__PURE__ */ defineComponent({
  // eslint-disable-next-line vue/no-reserved-component-names
  name: 'Head',

  setup(_, { slots }) {
    const head = injectHead()

    const obj: Ref<HeadObjectPlain> = ref({})

    if (IS_BROWSER) {
      const cleanUp = head.addReactiveEntry(obj, { raw: true })
      onBeforeUnmount(() => {
        cleanUp()
      })
    }
    else {
      head.addEntry(obj, { raw: true })
    }

    return () => {
      watchEffect(() => {
        if (!slots.default)
          return
        obj.value = vnodesToHeadObj(slots.default())
      })
      return null
    }
  },
})
