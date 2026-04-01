/**
 * @file: cn.js
 * @path: roblox/frontend/src/utils/cn.js
 * @purpose: Utility function cho Tailwind CSS class name merging
 * @functionality: Combine clsx và tailwind-merge để xử lý CSS classes một cách thông minh
 * @connections: Được sử dụng bởi hầu hết các React components trong project
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function để merge class names với Tailwind
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
