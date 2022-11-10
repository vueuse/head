import type { Ref, VNode } from 'vue'
import { defineComponent, onBeforeUnmount, ref, watchEffect } from 'vue'
import type { ReactiveHead } from '@unhead/vue'
import { injectHead } from '@unhead/vue'
import { IsBrowser, Vue2 } from '../env'

const addVNodeToHeadObj = (node: VNode, obj: ReactiveHead) => {
  // @ts-expect-error vue2 vnode API
  const nodeType = Vue2 ? node.tag : node.type
  const type
    = nodeType === 'html'
      ? 'htmlAttrs'
      : nodeType === 'body'
        ? 'bodyAttrs'
        : (nodeType as keyof ReactiveHead)

  if (typeof type !== 'string' || !(type in obj))
    return

  // @ts-expect-error vue2 vnode API
  const nodeData = Vue2 ? node.data : node
  const props: Record<string, any> = (Vue2 ? nodeData.attrs : node.props) || {}
  // handle class and style attrs
  if (Vue2) {
    if (nodeData.staticClass)
      props.class = nodeData.staticClass
    if (nodeData.staticStyle)
      props.style = Object.entries(nodeData.staticStyle).map(([key, value]) => `${key}:${value}`).join(';')
  }
  if (node.children) {
    const childrenAttr = Vue2 ? 'text' : 'children'
    props.children = Array.isArray(node.children)
      // @ts-expect-error untyped
      ? node.children[0]![childrenAttr]
      // @ts-expect-error vue2 vnode API
      : node[childrenAttr]
  }
  if (Array.isArray(obj[type]))
    (obj[type] as Record<string, any>[]).push(props)

  else if (type === 'title')
    obj.title = props.children

  else
    (obj[type] as Record<string, any>) = props
}

const vnodesToHeadObj = (nodes: VNode[]) => {
  const obj: ReactiveHead = {
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

    const obj: Ref<ReactiveHead> = ref({})

    const entry = head.push(obj)

    if (IsBrowser) {
      onBeforeUnmount(() => {
        entry.dispose()
      })
    }

    return () => {
      watchEffect(() => {
        if (!slots.default)
          return
        entry.patch(vnodesToHeadObj(slots.default()))
      })
      return null
    }
  },
})
