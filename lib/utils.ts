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

// Format errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function formatErrors(error: any) {
  if (error.name === "ZodError") {
    const issues =
      error.issues?.map((issue: { message: string }) => issue.message) || [];
    return issues.join(". ");
  } else if (
    error.name === "PrismaClientKnownRequestError" &&
    error.code === "P2002"
  ) {
    // Handle Prisma errors
    const field = error.meta?.target ? error.meta.target[0] : "Field";
    return `The ${
      field.charAt(0).toUpperCase() + field.slice(1)
    } already exists`;
  } else {
    // Handle other errors
    return typeof error.message === "string"
      ? error.message
      : JSON.stringify(error.message);
  }
}

// Round number to 2 decimal places
export function roundTo2DecimalPlaces(value: number | string): number {
  if (typeof value === "number")
    return Math.round((value + Number.EPSILON) * 100) / 100;
  else if (typeof value === "string")
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  throw new Error("Value is not a number or string");
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

// Format currency using the formatter above
export function formatCurrency(amount: number | string | null) {
  if (typeof amount === "number") {
    return CURRENCY_FORMATTER.format(amount);
  } else if (typeof amount === "string") {
    return CURRENCY_FORMATTER.format(Number(amount));
  } else {
    return "NaN";
  }
}
