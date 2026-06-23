import type { Product } from "../types/product.types";

const PRODUCT_DISCOUNT_IDS_KEY = "buy_product_discount_ids_v1";

const pickRandomIds = (items: string[], count: number) => {
  const ids = [...items];
  const selection: string[] = [];

  while (selection.length < count && ids.length > 0) {
    const index = Math.floor(Math.random() * ids.length);
    selection.push(ids[index]);
    ids.splice(index, 1);
  }

  return selection;
};

export function getStoredDiscountProductIds(): string[] | null {
  const storedIds = sessionStorage.getItem(PRODUCT_DISCOUNT_IDS_KEY);

  if (!storedIds) return null;

  try {
    const ids = JSON.parse(storedIds) as string[];
    if (Array.isArray(ids) && ids.every((id) => typeof id === "string")) {
      return ids;
    }
  } catch {
    // ignore invalid data
  }

  return null;
}

export function ensureDiscountProductIds(productIds: string[]): string[] {
  const storedIds = getStoredDiscountProductIds();

  if (storedIds && storedIds.every((id) => productIds.includes(id))) {
    return storedIds;
  }

  const randomIds = pickRandomIds(productIds, 2);
  sessionStorage.setItem(PRODUCT_DISCOUNT_IDS_KEY, JSON.stringify(randomIds));
  return randomIds;
}

export function applySessionDiscount(product: Product, discountIds: string[] | null): Product {
  if (!discountIds?.includes(product.id)) {
    return product;
  }

  return {
    ...product,
    discountPercent: 10,
    discountLabel: "10% descuento",
  };
}
