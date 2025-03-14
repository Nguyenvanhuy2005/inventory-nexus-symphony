
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency to Vietnamese Dong
export function formatCurrency(value: string | undefined) {
  if (!value) return "0 ₫";
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(Number(value));
}

// Format date
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

// Generate a random ID (used for temporary IDs before API submission)
export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}
