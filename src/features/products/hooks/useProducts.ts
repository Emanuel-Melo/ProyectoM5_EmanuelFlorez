import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { Product, ProductFiltersState } from "../types/product.types";

const initialFilters: ProductFiltersState = {
  category: "all",
  minPrice: "",
  maxPrice: "",
  onlyInStock: false,
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const mapProduct = (id: string, data: Record<string, unknown>): Product => ({
  id,
  name: String(data.name ?? "Producto sin nombre"),
  description: String(data.description ?? ""),
  price: Number(data.price ?? 0),
  stock: Number(data.stock ?? 0),
  category: String(data.category ?? "otros"),
  imageUrl: String(data.imageUrl ?? ""),
  active: data.active === undefined ? true : Boolean(data.active),
});

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ProductFiltersState>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const snapshot = await getDocs(collection(db, "products"));
        const productsFromFirestore = snapshot.docs
          .map((productDoc) => mapProduct(productDoc.id, productDoc.data()))
          .filter((product) => product.active);

        if (!ignore) {
          setProducts(productsFromFirestore);
        }
      } catch (fetchError) {
        if (!ignore) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "No se pudieron cargar los productos."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchProducts();

    return () => {
      ignore = true;
    };
  }, []);

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.category)))
        .filter(Boolean)
        .sort((firstCategory, secondCategory) =>
          firstCategory.localeCompare(secondCategory)
        ),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    const minPrice = filters.minPrice ? Number(filters.minPrice) : null;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        normalizeText(product.name).includes(normalizedSearch) ||
        normalizeText(product.description).includes(normalizedSearch) ||
        normalizeText(product.category).includes(normalizedSearch);

      const matchesCategory =
        filters.category === "all" || product.category === filters.category;

      const matchesMinPrice = minPrice === null || product.price >= minPrice;
      const matchesMaxPrice = maxPrice === null || product.price <= maxPrice;
      const matchesStock = !filters.onlyInStock || product.stock > 0;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesStock
      );
    });
  }, [filters, products, searchTerm]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilters(initialFilters);
  };

  return {
    categories,
    error,
    filteredProducts,
    filters,
    loading,
    products,
    resetFilters,
    searchTerm,
    setFilters,
    setSearchTerm,
  };
}
