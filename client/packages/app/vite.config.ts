import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 自定义插件：开发时服务 adp-chat-component 的 widget 静态资源
 * 支持 /static/adp-chat-component/umd/widget/ 路径（与生产环境一致）
 */
function serveWidgetPlugin() {
  const widgetDir = path.resolve(__dirname, '../adp-chat-component/public/widget')
  
  return {
    name: 'serve-widget',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        // 处理 /static/adp-chat-component/umd/widget/ 路径的请求
        const widgetPrefix = '/static/adp-chat-component/umd/widget/'
        if (req.url?.startsWith(widgetPrefix)) {
          const fileName = req.url.replace(widgetPrefix, '')
          const filePath = path.join(widgetDir, fileName)
          
          if (existsSync(filePath)) {
            const content = readFileSync(filePath)
            const ext = path.extname(fileName)
            const contentType = ext === '.js' ? 'application/javascript' : 'text/plain'
            res.setHeader('Content-Type', contentType)
            res.end(content)
            return
          }
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isAnalyze = mode === 'analyze'
  return {
    base: './',
    plugins: [
      vue(),
      vueJsx() as any,
      // 打包分析插件，使用 pnpm build --mode analyze 启用
      isAnalyze && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        manifest: {
          id: './',
          name: '双百工程',
          short_name: '双百工程',
          description: '双百工程智能问答演示应用',
          start_url: './',
          scope: './',
          display: 'standalone',
          theme_color: '#0b6bff',
          background_color: '#eef5ff',
          lang: 'zh-CN',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: 'index.html',
          maximumFileSizeToCacheInBytes: 7 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          globIgnores: ['**/assets/adp-widget-*.js'],
        },
        devOptions: {
          enabled: false,
        },
      }),
      // 开发时服务 widget 静态资源（widget 只存放于 adp-chat-component 中）
      serveWidgetPlugin(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      // 确保依赖去重，避免多个 Vue/TDesign 实例
      dedupe: ['vue', 'tdesign-vue-next'],
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: ['tdesign-vue-next'],
      // 排除 workspace 包，让其使用源码
      exclude: ['adp-chat-component', 'adp-widget'],
    },
    server: {
      host: '0.0.0.0',
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.SERVICE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
