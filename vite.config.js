import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => {

  const proxyTarget = process.env.VITE_PROXY_TARGET || "https://medassist-backend-hryu.onrender.com";

  console.log(`[Vite] Proxy target: ${proxyTarget}`);

  return {
    plugins: [tailwindcss(), react()],
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
      },
      // Allow access from network (for testing on mobile devices)
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
              if (id.includes("react")) return "vendor-react";
              if (
                id.includes("lucide-react") ||
                id.includes("html2canvas") ||
                id.includes("dompurify")
              )
                return "vendor-utils";
              if (id.includes("exceljs")) return "vendor-exceljs";
              if (id.includes("jspdf")) return "vendor-pdf";
              if (id.includes("recharts")) return "vendor-charts";
              if (id.includes("framer-motion")) return "vendor-motion";
              if (id.includes("html5-qrcode")) return "vendor-scanner";
              return "vendor";
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
