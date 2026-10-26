import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 1. 這裡必須是你的 GitHub Repository 名稱，前後都要有斜線！
  base: '/1151VIS-HW2-415085085-wu-wei-chen/',
  
  // 2. 告訴 Vite 把打包後的檔案丟到 docs 資料夾
  build: {
    outDir: 'docs'
  }
})