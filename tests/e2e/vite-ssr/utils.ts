import { getRandomPort, waitForPort } from "get-port-please"
import { execa } from "execa"
import { fileURLToPath } from "node:url"
import { resolvePath } from "mlly"
import { resolve } from "pathe"

const FixturePath = fileURLToPath(
  new URL("../../../examples/vite-ssr", import.meta.url),
)

export async function startServer() {
  const port = await getRandomPort()

  const vite = resolve(await resolvePath("vite"), "../../../bin/vite.js")
  const serverProcess = execa(vite, [".", "--port", port.toString()], {
    cwd: FixturePath,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "development",
    },
  })
  await waitForPort(port, { retries: 32 })
  for (let i = 0; i < 50; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    try {
      await $fetch("/")
    } catch {}
  }
  return { serverProcess, url: `http://localhost:${port}` }
}

export async function createBrowser() {
  let playwright: typeof import("playwright")
  try {
    // Workround for https://github.com/nuxt/framework/issues/3470
    // TODO: Remove when upstream issue resolved
    playwright = await import(String("playwright"))
  } catch {
    /* istanbul ignore next */
    throw new Error(`
      The dependency 'playwright' not found.
      Please run 'yarn add --dev playwright' or 'npm install --save-dev playwright'
    `)
  }
  return await playwright.chromium.launch()
}
