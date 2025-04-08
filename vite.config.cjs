const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

module.exports = defineConfig({
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