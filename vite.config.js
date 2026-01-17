import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'

// Plugin customizado para copiar componentes HTML
const copyComponentsPlugin = () => ({
  name: 'copy-components',
  writeBundle() {
    // Copiar componentes HTML para dist
    try {
      mkdirSync('dist/src/components', { recursive: true });
      const componentes = ['pacientes', 'consultas', 'exames', 'farmacia', 'configuracoes', 'calculadora', 'doarsangue'];
      
      for (const componente of componentes) {
        const src = `src/components/${componente}.html`;
        const dest = `dist/src/components/${componente}.html`;
        copyFileSync(src, dest);
      }
    } catch (error) {
      // Erro silencioso
    }
  }
})

export default defineConfig({
  plugins: [tailwindcss(), copyComponentsPlugin()],
  root: './',
  server: {
    port: 5173,
    open: true,
    middlewareMode: false,
    fs: {
      strict: false
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    reportCompressedSize: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html')
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  }
})
