import { ProductCard } from "./ProductCard";
import type { Product } from "../types/product.types";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="products-empty">
        <h2>No hay productos para mostrar</h2>
        <p>Ajusta la busqueda o cambia los filtros activos.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
