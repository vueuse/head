import type { Ref, VNode } from 'vue'
import { defineComponent, onBeforeUnmount, ref, watchEffect } from 'vue'
import type { HeadObjectPlain } from './types'
import type { HeadAttrs } from './index'
import { injectHead } from './index'

const addVNodeToHeadObj = (node: VNode, obj: HeadObjectPlain) => {
  const type
    = node.type === 'html'
      ? 'htmlAttrs'
      : node.type === 'body'
        ? 'bodyAttrs'
        : (node.type as keyof HeadObjectPlain)

  if (typeof type !== 'string' || !(type in obj))
    return

  const props = {
    ...node.props,
    children: Array.isArray(node.children)
      // @ts-expect-error untyped
      ? node.children[0]!.children
      : node.children,
  } as HeadAttrs
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

    let obj: Ref<HeadObjectPlain>

    onBeforeUnmount(() => {
      // eslint-disable-next-line vue/no-ref-as-operand
      if (obj) {
        head.removeHeadObjs(obj)
        head.updateDOM()
      }
    })

    return () => {
      watchEffect(() => {
        if (!slots.default)
          return
        // eslint-disable-next-line vue/no-ref-as-operand
        if (obj)
          head.removeHeadObjs(obj)
        // eslint-disable-next-line vue/no-ref-as-operand
        obj = ref(vnodesToHeadObj(slots.default()))
        head.addHeadObjs(obj)
        if (typeof window !== 'undefined')
          head.updateDOM()
      })
      return null
    }
  },
})
