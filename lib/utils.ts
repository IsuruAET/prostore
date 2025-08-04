import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert prisma object into a regular JS object
export function convertToJSObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// Format number with 2 decimal places
export function formatNumberWithDecimal(num: number): string {
  const [intPart, floatPart] = num.toString().split(".");
  return floatPart ? `${intPart}.${floatPart.padEnd(2, "0")}` : `${intPart}.00`;
}
