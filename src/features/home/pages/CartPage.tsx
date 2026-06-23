import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../cart/context/CartContext";
import "./HomePage.css";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  currency: "COP",
  maximumFractionDigits: 0,
  style: "currency",
});

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, clear } = useCart();
  const [loading, setLoading] = useState(false);

  const total = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Simular llamada a API / trámites de pago
      await new Promise((res) => setTimeout(res, 1000));
      // Aquí se completarían los pasos reales de compra
      alert("Compra completada correctamente. Gracias por su compra.");
      clear();
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="cart-page container">
      <h1>Carrito de compras</h1>
      {items.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <div className="cart-grid">
          <div className="cart-items">
            {items.map((it) => (
              <article className="cart-item" key={it.id}>
                <img src={it.imageUrl} alt={it.name} />
                <div className="cart-item-body">
                  <h3>{it.name}</h3>
                  <p>{it.description}</p>
                  <div className="cart-item-meta">
                    <strong>{currencyFormatter.format(it.price)}</strong>
                    <span>Cantidad: {it.quantity}</span>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <button onClick={() => removeItem(it.id)} disabled={loading}>
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Resumen del pedido</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{currencyFormatter.format(total)}</dd>
              </div>
            </dl>
            <div className="cart-summary-actions">
              <button className="button button-primary" onClick={handleCheckout} disabled={loading}>
                {loading ? "Procesando..." : "Finalizar compra"}
              </button>
              <button className="button" onClick={clear} disabled={loading}>
                Vaciar carrito
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
