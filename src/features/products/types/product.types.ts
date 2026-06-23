export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  active?: boolean;
  discountPercent?: number;
  discountLabel?: string;
};

export type ProductFiltersState = {
  category: string;
  minPrice: string;
  maxPrice: string;
  onlyInStock: boolean;
};
