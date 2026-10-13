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
  if (!targetCategory) {
    return false;
  }

  const cleanTarget = String(targetCategory).toLowerCase().trim().replace(/^cat-/, '');
  if (!cleanTarget) {
    return false;
  }

  if (cleanTarget === 'all' || cleanTarget === 'all-jewellery') {
    return true;
  }

  const pCat = String(product.category || '').toLowerCase().trim().replace(/^cat-/, '');
  const pSub = String(product.subcategory || '').toLowerCase().trim().replace(/^cat-/, '');

  // Normalize singular/plural for core jewelry types
  const normalize = (cat: string) => {
    if (!cat) return '';
    if (cat === 'ring' || cat === 'rings') return 'rings';
    if (cat === 'earring' || cat === 'earrings') return 'earrings';
    if (cat === 'bracelet' || cat === 'bracelets') return 'bracelets';
    if (cat === 'necklace' || cat === 'necklaces') return 'necklaces';
    if (cat === 'bangle' || cat === 'bangles') return 'bangles';
    if (cat === 'chain' || cat === 'chains') return 'chains';
    if (cat === 'pendant' || cat === 'pendants') return 'pendants';
    if (cat === 'jhumka' || cat === 'jhumkas') return 'jhumkas';
    if (cat === 'handchain' || cat === 'handchains' || cat === 'hand-chain' || cat === 'hand-chains') return 'handchains';
    if (cat === 'payal' || cat === 'anklet' || cat === 'anklets') return 'payal';
    if (cat === 'nosering' || cat === 'noserings' || cat === 'nose-ring' || cat === 'nose-rings' || cat === 'nath') return 'noserings';
    return cat.replace(/-/g, '').replace(/\s+/g, '');
  };

  const normTarget = normalize(cleanTarget);
  const normCat = normalize(pCat);
  const normSub = normalize(pSub);

  const coreCategories = ['rings', 'earrings', 'bracelets', 'necklaces', 'bangles', 'chains', 'pendants', 'jhumkas', 'handchains', 'payal', 'noserings'];

  // If the product has a recognized primary category that differs from the target category,
  // do not allow it into another category (e.g. bracelets, necklaces, earrings must never appear in rings)
  if (normTarget && normCat && normCat !== normTarget && coreCategories.includes(normCat)) {
    return false;
  }

  return Boolean(normTarget && (normCat === normTarget || normSub === normTarget));
}

