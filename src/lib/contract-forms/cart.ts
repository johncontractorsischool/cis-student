import type {
  ContractFormProduct,
  ContractFormsCart,
  ContractFormsCartItem,
} from "@/lib/contract-forms/types";

const SHOPIFY_DOMAIN = "https://www.lexanasignature.com";

function quantity(value: number | undefined): number {
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : 0;
}

export function getCartItems(
  products: readonly ContractFormProduct[],
  cart: ContractFormsCart,
): ContractFormsCartItem[] {
  return products.flatMap((product) => {
    const productQuantity = quantity(cart[product.id]);
    return productQuantity
      ? [{ productId: product.id, quantity: productQuantity, variantId: product.variantId }]
      : [];
  });
}

export function getCartCount(cart: ContractFormsCart): number {
  return Object.values(cart).reduce((total, value) => total + quantity(value), 0);
}

export function getCartTotal(
  products: readonly ContractFormProduct[],
  cart: ContractFormsCart,
): number {
  return products.reduce(
    (total, product) => total + product.price * quantity(cart[product.id]),
    0,
  );
}

export function getCheckoutUrl(items: readonly ContractFormsCartItem[]): string {
  if (!items.length) return "";
  const lineItems = items
    .filter((item) => /^\d+$/.test(item.variantId) && quantity(item.quantity))
    .map((item) => `${item.variantId}:${quantity(item.quantity)}`)
    .join(",");
  return lineItems ? `${SHOPIFY_DOMAIN}/cart/${lineItems}` : "";
}
