import { ProductCard } from "./ProductCard";
import type { Product } from "../types/product.types";

type ProductGridProps = {
  products: Product[];
};
// Sirve para devolver la representación visual de la cuadrícula de productos, mostrando una lista de tarjetas de productos. Si no hay productos para mostrar, se muestra un mensaje indicando que no hay productos disponibles y sugiriendo ajustar la búsqueda o cambiar los filtros activos.
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
