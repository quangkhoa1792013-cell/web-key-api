/**
 * @file: tailwind.config.js
 * @path: roblox/frontend/tailwind.config.js
 * @purpose: Cấu hình Tailwind CSS cho frontend application
 * @functionality: Định nghĩa content paths, custom colors (primary palette), theme extensions
 * @connections: Được sử dụng bởi src/styles/index.css và tất cả các React components
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
