export type ContractFormProductType = "PHYSICAL" | "DIGITAL" | "SERVICE";

export type ContractFormProduct = {
  description: readonly string[];
  id: string;
  imageUrl: string;
  notice: string;
  pickerLabel: string;
  previewLabel: string;
  price: number;
  title: string;
  type: ContractFormProductType;
  variantId: string;
};

export type ContractFormsPayload = {
  products: ContractFormProduct[];
};

export type ContractFormsCart = Record<string, number>;

export type ContractFormsCartItem = {
  productId: string;
  quantity: number;
  variantId: string;
};
