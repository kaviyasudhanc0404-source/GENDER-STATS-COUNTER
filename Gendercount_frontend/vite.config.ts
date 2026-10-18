import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    strictPort: true, // the backend only allows this origin (CORS_ORIGINS), so never fall back to another port
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep large libraries that rarely change in their own cacheable chunks
        manualChunks: { react: ["react", "react-dom"], firebase: ["firebase/app", "firebase/auth"] },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
