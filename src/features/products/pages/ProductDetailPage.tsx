import { Link, useParams } from "react-router-dom";
import { useState } from "react";

import { useCart } from "../../cart/context/CartContext";
import { useProductDetail } from "../hooks/useProductDetail";
import "../products.css";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  currency: "COP",
  maximumFractionDigits: 0,
  style: "currency",
});

function ProductDetailPage() {
  const { productId } = useParams();
  const { error, loading, product } = useProductDetail(productId);
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState("");

  if (loading) {
    return (
      <main className="catalog-page">
        <p className="catalog-status">Cargando detalle...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="catalog-page">
        <section className="product-detail-empty">
          <p className="eyebrow">Producto</p>
          <h1>No disponible</h1>
          <p>{error ?? "No se pudo cargar este producto."}</p>
          <Link className="button button-secondary" to="/products">
            Volver al catalogo
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="catalog-page">
      <Link className="catalog-back-link" to="/products">
        Volver al catalogo
      </Link>

      <section className="product-detail">
        <div className="product-detail-media">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <span>Sin imagen</span>
          )}
        </div>

        <div className="product-detail-info">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>

          <div className="product-detail-price">
            {currencyFormatter.format(product.price)}
          </div>

          <dl className="product-specs">
            <div>
              <dt>Stock</dt>
              <dd>{product.stock > 0 ? `${product.stock} unidades` : "Agotado"}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{product.active ? "Activo" : "Inactivo"}</dd>
            </div>
          </dl>

          <button
            className="button"
            type="button"
            disabled={product.stock <= 0 || isAdding}
            onClick={() => {
              if (product.stock <= 0 || isAdding) return;
              setIsAdding(true);
              addItem(product, 1);
              setAddedMessage("Producto agregado al carrito");
              window.setTimeout(() => setIsAdding(false), 600);
              window.setTimeout(() => setAddedMessage(""), 1400);
            }}
          >
            {isAdding ? "Añadiendo..." : "Agregar al carrito"}
          </button>
          {addedMessage ? <p className="add-feedback">{addedMessage}</p> : null}
        </div>
      </section>
    </main>
  );
}

export default ProductDetailPage;
