import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 8080,
    },
    proxy: {
      // Proxy API requests to the backend to avoid CORS in development
      // Paths proxied here should match the frontend API calls (e.g. /auth, /files, /notes, /quiz, /flashcards, /api)
      "/auth": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/files": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/notes": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/quiz": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/flashcards": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/knowledge": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/learning-path": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/search": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/calendar": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/email": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/plagiarism": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/pdf": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/summarize": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
