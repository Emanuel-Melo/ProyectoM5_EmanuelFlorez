import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import {
  applySessionDiscount,
  ensureDiscountProductIds,
  getStoredDiscountProductIds,
} from "./discountUtilities";
import type { Product } from "../types/product.types";

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

export function useProductDetail(productId?: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchProduct = async () => {
      if (!productId) {
        setProduct(null);
        setLoading(false);
        setError("No se encontro el identificador del producto.");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const productSnapshot = await getDoc(doc(db, "products", productId));

        if (!productSnapshot.exists()) {
          if (!ignore) {
            setProduct(null);
            setError("El producto no existe o ya no esta disponible.");
          }
          return;
        }

        const productFromFirestore = mapProduct(
          productSnapshot.id,
          productSnapshot.data()
        );

        let discountIds = getStoredDiscountProductIds();

        if (!discountIds) {
          const allProductsSnapshot = await getDocs(collection(db, "products"));
          const allProductIds = allProductsSnapshot.docs.map((productDoc) => productDoc.id);
          discountIds = ensureDiscountProductIds(allProductIds);
        }

        const productWithDiscount = applySessionDiscount(
          productFromFirestore,
          discountIds
        );

        if (!ignore) {
          setProduct(productWithDiscount.active ? productWithDiscount : null);
          setError(
            productWithDiscount.active
              ? null
              : "El producto no esta disponible actualmente."
          );
        }
      } catch (fetchError) {
        if (!ignore) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "No se pudo cargar el detalle del producto."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchProduct();

    return () => {
      ignore = true;
    };
  }, [productId]);

  return { error, loading, product };
}
