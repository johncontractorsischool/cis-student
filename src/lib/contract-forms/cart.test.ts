import { describe, expect, it } from "vitest";

import { getCartCount, getCartItems, getCartTotal, getCheckoutUrl } from "./cart";
import type { ContractFormProduct } from "./types";

const products: ContractFormProduct[] = [
  {
    id: "first",
    title: "First",
    pickerLabel: "First",
    variantId: "111",
    price: 12.5,
    type: "PHYSICAL",
    previewLabel: "First",
    imageUrl: "https://example.com/first.png",
    description: [],
    notice: "Notice",
  },
  {
    id: "second",
    title: "Second",
    pickerLabel: "Second",
    variantId: "222",
    price: 30,
    type: "DIGITAL",
    previewLabel: "Second",
    imageUrl: "https://example.com/second.png",
    description: [],
    notice: "Notice",
  },
];

describe("contract forms cart", () => {
  it("keeps catalog order and ignores empty quantities", () => {
    expect(getCartItems(products, { first: 2, second: 0 })).toEqual([
      { productId: "first", quantity: 2, variantId: "111" },
    ]);
  });

  it("calculates the item count and total", () => {
    const cart = { first: 2, second: 1 };
    expect(getCartCount(cart)).toBe(3);
    expect(getCartTotal(products, cart)).toBe(55);
  });

  it("builds the Shopify cart permalink used by ExamPrep", () => {
    expect(getCheckoutUrl(
      getCartItems(products, { first: 2, second: 1 }),
      "https://shop.example.com/store/",
    )).toBe(
      "https://shop.example.com/store/cart/111:2,222:1",
    );
  });

  it("does not produce a checkout URL for an empty cart", () => {
    expect(getCheckoutUrl([], "https://shop.example.com")).toBe("");
  });

  it("rejects unsafe or missing storefront destinations", () => {
    const items = getCartItems(products, { first: 1 });
    expect(getCheckoutUrl(items, "javascript:alert(1)")).toBe("");
    expect(getCheckoutUrl(items, "")).toBe("");
  });
});
