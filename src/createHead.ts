import type { MergeHead } from '@unhead/vue'
import { createHead as createUnhead } from '@unhead/vue'
import type {
  CreateHeadOptions,
  Head,
} from '@unhead/schema'
import type { VueHeadClientPollyFill } from '@unhead/vue/polyfill'
import { polyfillAsVueUseHead } from '@unhead/vue/polyfill'

export function createHead<T extends MergeHead = {}>(initHeadObject?: Head<T>, options?: CreateHeadOptions): VueHeadClientPollyFill<T> {
  const unhead = createUnhead<T>(options || {})

  const legacyHead = polyfillAsVueUseHead(unhead)
  if (initHeadObject)
    legacyHead.push(initHeadObject)

  return legacyHead
}
