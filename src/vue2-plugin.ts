import type { Plugin } from 'vue-demi'
import { PROVIDE_KEY } from './constants'

export const HeadVuePlugin: Plugin = function (_Vue) {
  _Vue.mixin({
    beforeCreate() {
      const options = this.$options
      if (options.head) {
        const origProvide = options.provide
        options.provide = function () {
          let origProvideResult
          if (typeof origProvide === 'function')
            origProvideResult = origProvide.call(this)
          else
            origProvideResult = origProvide || {}

          return {
            ...origProvideResult,
            [PROVIDE_KEY]: options.head,
          }
        }

        if (!this.$head)
          this.$head = options.head
      }
      else if (!this.$head && options.parent && options.parent.$head) {
        this.$head = options.parent.$head
      }
    },
  })
}
