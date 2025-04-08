import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

// ESM uyumlu __dirname oluşturma
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, "client"),  // client klasörünü kök dizin olarak belirtiyoruz
  build: {
    outDir: path.resolve(__dirname, "dist"), // Çıktı dosyasının yerini belirtiyoruz
    emptyOutDir: true,  // Eski dosyaları temizle
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),  // src dizini için alias
      "@shared": path.resolve(__dirname, "shared"),  // shared dizini için alias
      "@assets": path.resolve(__dirname, "attached_assets"), // attached_assets dizini için alias
    },
  },
});