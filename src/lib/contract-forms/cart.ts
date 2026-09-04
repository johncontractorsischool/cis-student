import type {
  ContractFormProduct,
  ContractFormsCart,
  ContractFormsCartItem,
} from "@/lib/contract-forms/types";

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

export function getCheckoutUrl(
  items: readonly ContractFormsCartItem[],
  checkoutBaseUrl: string,
): string {
  if (!items.length || !checkoutBaseUrl) return "";
  let baseUrl: URL;
  try {
    baseUrl = new URL(checkoutBaseUrl);
  } catch {
    return "";
  }
  if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") return "";

  const lineItems = items
    .filter((item) => /^\d+$/.test(item.variantId) && quantity(item.quantity))
    .map((item) => `${item.variantId}:${quantity(item.quantity)}`)
    .join(",");
  if (!lineItems) return "";
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, "")}/cart/${lineItems}`;
  baseUrl.search = "";
  baseUrl.hash = "";
  return baseUrl.toString();
}
