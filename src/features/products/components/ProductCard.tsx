import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../cart/context/CartContext";
import { useFavorites } from "../../favorites/context/FavoritesContext";

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
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAdding, setIsAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState("");
  const favorite = isFavorite(product.id);

  const handleAdd = () => {
    if (isAdding) return;
    setIsAdding(true);
    addItem(product, 1);
    setAddedMessage("Producto agregado al carrito");

    window.setTimeout(() => {
      setIsAdding(false);
    }, 600);

    window.setTimeout(() => {
      setAddedMessage("");
    }, 1400);
  };

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
          <div className="product-card-actions">
            <button
              className="button"
              type="button"
              onClick={handleAdd}
              disabled={isAdding}
            >
              {isAdding ? "Añadiendo..." : "Añadir al carrito"}
            </button>
            <button
              type="button"
              className={`button button-secondary ${favorite ? "favorite-active" : ""}`}
              onClick={() => toggleFavorite(product)}
              aria-label={favorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
            >
              {favorite ? "❤️" : "🩶"}
            </button>
          </div>
          {addedMessage ? <p className="add-feedback">{addedMessage}</p> : null}
        </div>
      </div>
    </article>
  );
}
