import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  root: "./client",
  plugins: [react()],
  server: {
    host: true,
    // don't forget to add routes here!!
    proxy: {
      "/api": "http://localhost:3000",
      "/oauth": "http://localhost:3000",
    },
  },
});


// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       "/api": {
//         target: "http://localhost:3000",
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// });
