/**
 * @file: tailwind.config.js
 * @path: roblox/tailwind.config.js
 * @purpose: Cấu hình Tailwind CSS cho toàn bộ dự án
 * @functionality: Định nghĩa theme colors, content paths, và plugins cho Tailwind CSS
 * @connections: Được sử dụng bởi frontend/src/styles/index.css và các file frontend khác
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
