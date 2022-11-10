import fs from 'fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vue from '@vitejs/plugin-vue'
import { renderToString } from '@vue/server-renderer'
import { renderHeadToString } from '../../src'

export default defineConfig({
  plugins: [
    vueJsx({
      // options are passed on to @vue/babel-plugin-jsx
    }),
    vue({}),
    {
      name: 'ssr',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url!.startsWith('/ssr/'))
            return next()

          let html = fs.readFileSync(resolve(__dirname, 'index.html'), 'utf8')

          const mod = (await server.ssrLoadModule(
            '/app.tsx',
          )) as typeof import('./app')
          const { app, router, head } = await mod.createApp()
          await router.push(req.url!)
          await router.isReady()
          const appHTML = await renderToString(app)
          const headHTML = await renderHeadToString(head)
          html = await server.transformIndexHtml(req.url!, html)
          res.setHeader('content-type', 'text/html')
          res.end(
            html
              .replace('<html>', `<html${headHTML.htmlAttrs}>`)
              .replace('<body>', `<body${headHTML.bodyAttrs}>\n${headHTML.bodyTagsOpen}`)
              .replace('</body>', `${headHTML.bodyTags}</body>`)
              .replace('</head>', `${headHTML.headTags}</head>`)
              .replace(
                '<div id="app"></div>',
                `<div id="app">${appHTML}</div>`,
              ),
          )
        })
      },
    },
  ],
})
