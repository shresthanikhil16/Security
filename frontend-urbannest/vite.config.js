import react from "@vitejs/plugin-react";
import fs from "fs";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync("./.cert/key.pem"),
      cert: fs.readFileSync("./.cert/cert.pem"),
    },
    proxy: {
      "/api": {
        target: "https://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  assetsInclude: ["/*.PNG", "/*.png"],
});