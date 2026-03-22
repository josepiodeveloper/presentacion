import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    minify: "terser",
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        scene: resolve(__dirname, 'scene.html')
      },
    },
  },
});
