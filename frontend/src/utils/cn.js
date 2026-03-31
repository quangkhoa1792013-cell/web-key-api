import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function để merge class names với Tailwind
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
