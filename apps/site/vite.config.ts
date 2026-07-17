import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    // Auto-open the browser on `yarn dev`, same as the web app. HMR is on by
    // default in Vite dev — edits to src hot-reload without a full refresh.
    open: true,
  },
  preview: {
    port: 3001,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          chakra: ["@chakra-ui/react", "@emotion/react", "@emotion/styled"],
          gsap: ["gsap", "@gsap/react"],
        },
      },
    },
  },
});
