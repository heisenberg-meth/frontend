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
              // Group essential react dependencies together
              if (
                id.includes("react") ||
                id.includes("react-dom") ||
                id.includes("react-router-dom")
              ) {
                return "vendor-react";
              }
              // Group heavy dependencies
              if (id.includes("exceljs") || id.includes("jspdf") || id.includes("recharts")) {
                return "vendor-heavy";
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
