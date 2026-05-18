import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind classes.
 * This is the DEFINITIVE source of cn() per RULES.md §9.3.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}