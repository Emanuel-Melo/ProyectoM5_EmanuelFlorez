import { useState } from "react";
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
  const { items, removeItem, updateQuantity, clear } = useCart();
  const [loading, setLoading] = useState(false);

  const total = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Simular llamada a API / trámites de pago
      await new Promise((res) => setTimeout(res, 1000));
      alert("Compra completada correctamente. Gracias por su compra.");
      clear();
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="cart-page container">
      <div className="cart-page-header">
        <div>
          <p className="eyebrow">Carrito de compras</p>
          <h1>Revisa los productos que has agregado a tu carrito</h1>
          <p className="cart-page-subtitle">
            Ajusta cantidades y confirma tu pedido con un solo clic.
          </p>
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={clear}
          disabled={loading || items.length === 0}
        >
          Vaciar carrito
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-cart-box">
          <h2>Tu carrito está vacío</h2>
          <p>Añade productos desde la tienda y regresá cuando estés listo para pagar.</p>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items">
            {items.map((it) => (
              <article className="cart-item" key={it.id}>
                <img src={it.imageUrl} alt={it.name} />
                <div className="cart-item-details">
                  <div>
                    <span className="cart-item-category">{it.category}</span>
                    <h3>{it.name}</h3>
                    <p>{it.description}</p>
                  </div>

                  <div className="cart-item-meta">
                    <div className="quantity-controls">
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}
                        disabled={loading || it.quantity <= 1}
                      >
                        −
                      </button>
                      <span>{it.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.id, it.quantity + 1)}
                        disabled={loading}
                      >
                        +
                      </button>
                    </div>
                    <div className="price-block">
                      <small>Precio unitario</small>
                      <strong>{currencyFormatter.format(it.price)}</strong>
                    </div>
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div>
                    <span className="cart-item-total">
                      {currencyFormatter.format((it.price || 0) * (it.quantity || 1))}
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => removeItem(it.id)}
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <div className="summary-card">
              <div className="summary-header">
                <h2>Resumen del pedido</h2>
                <p>{items.length} artículos</p>
              </div>
              <dl className="summary-list">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{currencyFormatter.format(total)}</dd>
                </div>
                <div>
                  <dt>Envío</dt>
                  <dd>Gratis</dd>
                </div>
                <div>
                  <dt>Descuento</dt>
                  <dd>- $0</dd>
                </div>
              </dl>
              <div className="summary-total">
                <span>Total</span>
                <strong>{currencyFormatter.format(total)}</strong>
              </div>
              <button
                className="button button-primary"
                type="button"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? "Procesando..." : "Finalizar compra"}
              </button>
              <p className="summary-note">Pago 100% seguro</p>
            </div>

            <div className="order-info">
              <section>
                <h3>Información de envío</h3>
                <p>Envío gratis en compras superiores a $500.000</p>
                <p>Tiempo estimado de entrega: 24-48 horas</p>
              </section>
              <section>
                <h3>Métodos de pago aceptados</h3>
                <div className="payment-methods">
                  <span>VISA</span>
                  <span>Mastercard</span>
                  <span>PayPal</span>
                  <span>Apple Pay</span>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
