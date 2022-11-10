import { createHead, renderHeadToString } from '@vueuse/head'
import { defineNuxtPlugin } from '#app'

// Note: This is just a copy of Nuxt's internal head plugin with modifications made for this issue

export default defineNuxtPlugin((nuxtApp) => {
  const head = createHead()

  nuxtApp.vueApp.use(head)

  console.log('created head instance')

  if (process.client) {

    // pause dom updates until page is ready and between page transitions
    let pauseDOMUpdates = true
    head.hooks.hook('dom:beforeRender', (context) => {
      context.shouldRender = !pauseDOMUpdates
    })

    nuxtApp.hooks.hookOnce('app:mounted', () => {
      pauseDOMUpdates = false
      head.updateDOM()

      // start pausing DOM updates when route changes (trigger immediately)
      useRouter().beforeEach(() => {
        pauseDOMUpdates = true
      })
      // watch for new route before unpausing dom updates (triggered after suspense resolved)
      useRouter().afterEach(() => {
        pauseDOMUpdates = false
        head.updateDOM()
      })
    })
  }

  if (process.server) {
    nuxtApp.ssrContext!.renderMeta = async () => {
      const meta = await renderHeadToString(head)
      return {
        ...meta,
        // resolves naming difference with NuxtMeta and @vueuse/head
        bodyScripts: meta.bodyTags,
      }
    }
  }
})
