/**
 * Currency and string formatting utilities for SOFYRA
 */

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

export function formatRs(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
