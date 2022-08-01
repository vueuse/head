import { createApp } from "./app"

const { app, router, head } = createApp()

router.isReady().then(() => {
  app.mount("#app")

  // @ts-expect-error
  window.head = head
})
