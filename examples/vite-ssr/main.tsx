import { createApp } from './app'

const { app, router, head } = await createApp()

router.isReady().then(() => {
  app.mount('#app')

  console.log('setting head', head)
  // @ts-expect-error untyped
  window.head = head
})
