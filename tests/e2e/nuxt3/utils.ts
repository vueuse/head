import { getBrowser, url, useTestContext } from "@nuxt/test-utils"
import { expect } from "vitest"

export async function renderPage(path = "/") {
  const ctx = useTestContext()
  if (!ctx.options.browser) return

  const browser = await getBrowser()
  const page = await browser.newPage({})
  const pageErrors: any = []
  const consoleLogs: any = []

  page.on("console", (message: any) => {
    consoleLogs.push({
      type: message.type(),
      text: message.text(),
    })
  })
  page.on("pageerror", (err: any) => {
    pageErrors.push(err)
  })

  if (path) await page.goto(url(path), { waitUntil: "networkidle" })

  return <any>{
    page,
    pageErrors,
    consoleLogs,
  }
}

export async function expectNoClientErrors(path: string) {
  const ctx = useTestContext()
  if (!ctx.options.browser) return

  const { pageErrors, consoleLogs } = await renderPage(path)

  const consoleLogErrors = consoleLogs.filter((i: any) => i.type === "error")
  const consoleLogWarnings = consoleLogs.filter(
    (i: any) => i.type === "warning",
  )

  expect(pageErrors).toEqual([])
  expect(consoleLogErrors).toEqual([])
  expect(consoleLogWarnings).toEqual([])
}
