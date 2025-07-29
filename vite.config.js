import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  base: './', // 相对路径，适合静态部署
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false, // 生产环境不生成sourcemap
    minify: 'esbuild', // 使用esbuild压缩
    rollupOptions: {
      input: {
        main: 'src/index.html'
      },
      output: {
        // 资源文件命名
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(mp3|wav|ogg|flac)$/i.test(assetInfo.name)) {
            return `assets/audio/[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // 代码分割配置
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096 // 小于4KB的资源内联
  },
  server: {
    port: 4173,
    open: true,
    host: true // 允许外部访问
  },
  preview: {
    port: 4173,
    host: true
  },
  publicDir: '../public',
  // 优化配置
  optimizeDeps: {
    include: []
  },
  // 环境变量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})