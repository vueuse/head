import { MaybeComputedRef, resolveRef, resolveUnref } from "@vueuse/shared"
import { HeadObjectPlain, UseHeadInput } from "./types"

// Shamelessly taken from Next.js
export function isEqualNode(oldTag: Element, newTag: Element) {
  if (oldTag instanceof HTMLElement && newTag instanceof HTMLElement) {
    const nonce = newTag.getAttribute("nonce")
    // Only strip the nonce if `oldTag` has had it stripped. An element's nonce attribute will not
    // be stripped if there is no content security policy response header that includes a nonce.
    if (nonce && !oldTag.getAttribute("nonce")) {
      const cloneTag = newTag.cloneNode(true) as typeof newTag
      cloneTag.setAttribute("nonce", "")
      cloneTag.nonce = nonce
      return nonce === oldTag.nonce && oldTag.isEqualNode(cloneTag)
    }
  }

  return oldTag.isEqualNode(newTag)
}

export function resolveRefDeeply<T>(ref: MaybeComputedRef<T>): any {
  if (typeof ref === "function") {
    ref = resolveRef(ref)
    return ref
  }
  if (Array.isArray(ref)) {
    return ref.map(resolveRefDeeply)
  }
  if (typeof ref === "object") {
    return Object.fromEntries(
      // @ts-expect-error untyped
      Object.entries(ref).map(([key, value]) => [key, resolveRefDeeply(value)]),
    )
  }
  return ref
}

function resolveUnrefDeeply<T>(ref: MaybeComputedRef<T>): any {
  const root = resolveUnref(ref)
  if (!ref || !root) {
    return root
  }
  if (Array.isArray(root)) {
    return root.map(resolveUnrefDeeply)
  }
  if (typeof root === "object") {
    return Object.fromEntries(
      Object.entries(root).map(([key, value]) => [
        key,
        resolveUnrefDeeply(value),
      ]),
    )
  }
  return root
}

export function resolveHeadInput(obj: UseHeadInput): HeadObjectPlain {
  return resolveUnrefDeeply(obj)
}
