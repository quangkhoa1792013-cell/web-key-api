/**
 * @file: postcss.config.js
 * @path: roblox/frontend/postcss.config.js
 * @purpose: Cấu hình PostCSS cho CSS processing pipeline
 * @functionality: Tích hợp Tailwind CSS và Autoprefixer cho CSS optimization
 * @connections: Được sử dụng bởi Vite build process để xử lý CSS files
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
