import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileViewerRenderers } from '@file-viewer/vite-plugin';

export default defineConfig({
  // fileViewerRenderers 自动发现已安装的 @file-viewer/preset-* 并把
  // docx 渲染所需的 Worker / WASM / 字体资产拷贝到 <publicDir>/file-viewer/
  plugins: [react(), fileViewerRenderers({ copyAssets: true, preset: 'auto' })],
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers'],
          'utils-vendor': ['axios', 'zod', 'zustand'],
        },
      },
    },
  },
});
