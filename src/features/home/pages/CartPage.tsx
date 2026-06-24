import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../cart/context/CartContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { createOrder } from "../../orders/services/orderService";
import "./HomePage.css";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  currency: "COP",
  maximumFractionDigits: 0,
  style: "currency",
});

const getDiscountedItemPrice = (item: { price: number; discountPercent?: number }) =>
  item.discountPercent ? Math.round(item.price * (1 - item.discountPercent / 100)) : item.price;

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clear } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const customerDiscountKey = user ? `buy_first_purchase_used_${user.uid}` : "buy_first_purchase_used_guest_v1";
  const firstPurchaseDiscount = !localStorage.getItem(customerDiscountKey) ? 50 : 0;

  const total = items.reduce((sum, item) => {
    const unitPrice = getDiscountedItemPrice(item);
    return sum + unitPrice * (item.quantity || 1);
  }, 0);

  const discountAmount = Math.round((total * firstPurchaseDiscount) / 100);
  const totalAfterDiscount = total - discountAmount;

  const handleCheckout = async () => {
    if (!user) {
      alert("Debes iniciar sesión para finalizar tu compra.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        userId: user.uid,
        items,
        total: totalAfterDiscount,
        discount: discountAmount,
        shipping: "Gratis",
        status: "processing" as const,
      };

      const orderId = await createOrder(orderPayload);

      if (firstPurchaseDiscount > 0) {
        localStorage.setItem(customerDiscountKey, "true");
      }

      // Clear local cart first so UI updates immediately
      clear();

      alert("Compra completada correctamente. Gracias por su compra.");
      navigate(`/envios/${orderId}`);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo completar la compra. Intenta nuevamente.";
      alert(message);
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
                      <strong>{currencyFormatter.format(getDiscountedItemPrice(it))}</strong>
                    </div>
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div>
                    <span className="cart-item-total">
                      {currencyFormatter.format(
                        getDiscountedItemPrice(it) * (it.quantity || 1)
                      )}
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
                {firstPurchaseDiscount > 0 ? (
                  <div>
                    <dt>Descuento primera compra</dt>
                    <dd>-{currencyFormatter.format(discountAmount)}</dd>
                  </div>
                ) : (
                  <div>
                    <dt>Descuento</dt>
                    <dd>- $0</dd>
                  </div>
                )}
                <div>
                  <dt>Envío</dt>
                  <dd>Gratis</dd>
                </div>
              </dl>
              <div className="summary-total">
                <span>Total</span>
                <strong>{currencyFormatter.format(totalAfterDiscount)}</strong>
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
