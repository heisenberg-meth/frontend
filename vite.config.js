import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    env.VITE_PROXY_TARGET || "https://api.medassist.viyaninfo.com";

  console.log(`[Vite] Proxy target: ${proxyTarget}`);

  return {
    plugins: [
      tailwindcss(),
      react(),
      visualizer({ open: true, filename: "dist/stats.html" }),
    ],
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        "/avatars": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
      host: true,
      hmr: {
        host: "localhost",
        protocol: "ws",
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              // Group essential react dependencies together
              if (
                id.includes("react") ||
                id.includes("react-dom") ||
                id.includes("react-router-dom")
              ) {
                return "vendor-react";
              }
              // Split heavy dependencies to prevent huge vendor chunks
              if (id.includes("exceljs")) {
                return "vendor-excel";
              }
              if (id.includes("jspdf")) {
                return "vendor-pdf";
              }
              if (id.includes("recharts")) {
                return "vendor-charts";
              }
              return "vendor"; // all other dependencies
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
