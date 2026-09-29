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

/**
 * Strict category filtering for SOFYRA products
 * All Jewellery shows all products
 * Rings shows ONLY category === "rings"
 * Earrings shows ONLY category === "earrings"
 * Bracelets shows ONLY category === "bracelets"
 * Necklaces shows ONLY category === "necklaces"
 * Bangles shows ONLY category === "bangles"
 */
export function isCategoryMatch(
  product: { category?: string; subcategory?: string; name?: string; slug?: string },
  targetCategory: string | undefined | null
): boolean {
  if (!targetCategory || targetCategory === 'all' || targetCategory === 'all-jewellery') {
    return true;
  }

  const cleanTarget = String(targetCategory).toLowerCase().trim().replace(/^cat-/, '');
  const pCat = String(product.category || '').toLowerCase().trim().replace(/^cat-/, '');
  const pSub = String(product.subcategory || '').toLowerCase().trim().replace(/^cat-/, '');

  // Normalize singular/plural for core jewelry types
  const normalize = (cat: string) => {
    if (cat === 'ring') return 'rings';
    if (cat === 'earring') return 'earrings';
    if (cat === 'bracelet') return 'bracelets';
    if (cat === 'necklace') return 'necklaces';
    if (cat === 'bangle') return 'bangles';
    if (cat === 'chain') return 'chains';
    if (cat === 'pendant') return 'pendants';
    if (cat === 'jhumka') return 'jhumkas';
    return cat;
  };

  const normTarget = normalize(cleanTarget);
  const normCat = normalize(pCat);
  const normSub = normalize(pSub);

  return normCat === normTarget || normSub === normTarget;
}

