import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// this method is to resolve tailwind class conflicts across different components
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}