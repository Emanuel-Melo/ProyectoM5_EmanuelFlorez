import { Link } from "react-router-dom";

import type { Product } from "../types/product.types";

type ProductCardProps = {
  product: Product;
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  currency: "COP",
  maximumFractionDigits: 0,
  style: "currency",
});

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <Link className="product-card-media" to={`/products/${product.id}`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span>Sin imagen</span>
        )}
      </Link>

      <div className="product-card-body">
        <div className="product-card-meta">
          <span>{product.category}</span>
          <span>{product.stock > 0 ? `${product.stock} und.` : "Agotado"}</span>
        </div>

        <h2>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h2>
        <p>{product.description}</p>

        <div className="product-card-footer">
          <strong>{currencyFormatter.format(product.price)}</strong>
          <Link className="button button-secondary" to={`/products/${product.id}`}>
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}
