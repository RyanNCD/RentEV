// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://rentev-b7ee.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
