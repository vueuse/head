import type { Ref, VNode } from 'vue'
import { defineComponent, onBeforeUnmount, ref, version, watchEffect } from 'vue'
import type { HeadObjectPlain } from './types'
import type { HeadAttrs } from './index'
import { IS_BROWSER, injectHead } from './index'

const isVue2 = version.startsWith('2.')

const addVNodeToHeadObj = (node: VNode, obj: HeadObjectPlain) => {
  // @ts-expect-error vue2 vnode API
  const nodeType = isVue2 ? node.tag : node.type
  const type
    = nodeType === 'html'
      ? 'htmlAttrs'
      : nodeType === 'body'
        ? 'bodyAttrs'
        : (nodeType as keyof HeadObjectPlain)

  if (typeof type !== 'string' || !(type in obj))
    return

  // @ts-expect-error vue2 vnode API
  const nodeData = isVue2 ? node.data : node
  const props: HeadAttrs = (isVue2 ? nodeData.attrs : node.props) || {} as HeadAttrs
  // handle class and style attrs
  if (isVue2) {
    if (nodeData.staticClass)
      props.class = nodeData.staticClass
    if (nodeData.staticStyle)
      props.style = Object.entries(nodeData.staticStyle).map(([key, value]) => `${key}:${value}`).join(';')
  }
  if (node.children) {
    const childrenAttr = isVue2 ? 'text' : 'children'
    props.children = Array.isArray(node.children)
      // @ts-expect-error untyped
      ? node.children[0]![childrenAttr]
      // @ts-expect-error vue2 vnode API
      : node[childrenAttr]
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
      const cleanUp = head.addReactiveEntry(obj)
      onBeforeUnmount(() => {
        cleanUp()
      })
    }
    else {
      head.addEntry(obj)
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
