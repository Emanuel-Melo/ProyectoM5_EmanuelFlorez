import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";
import { fetchOrderById, type OrderSummary } from "../../orders/services/orderService";
import "./HomePage.css";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const orderStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  shipped: "En camino",
  delivered: "Entregado",
  canceled: "Cancelado",
};

const orderProgressSteps = ["Procesando", "En camino", "En entrega", "Entregado"];
// Esta función sirve para determinar el paso activo en la barra de progreso del pedido según su estado. Devuelve un índice que representa el paso actual: 0 para "pending" o "processing", 1 para "shipped", 3 para "delivered", y 0 por defecto para cualquier otro estado.
const getActiveStep = (status: string) => {
  switch (status) {
    case "pending":
    case "processing":
      return 0;
    case "shipped":
      return 1;
    case "delivered":
      return 3;
    default:
      return 0;
  }
};
// Devuelve la representación visual de la página de detalle del pedido, mostrando información sobre el estado del pedido, los productos incluidos y el total. Permite al usuario ver el progreso del envío y regresar a la lista de envíos. Maneja casos de carga, errores y permisos de acceso según el usuario autenticado.
function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !orderId) {
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedOrder = await fetchOrderById(orderId);

        if (!fetchedOrder) {
          setError("Pedido no encontrado.");
          setOrder(null);
          return;
        }

        if (fetchedOrder.userId !== user.uid) {
          setError("No tienes permiso para ver este pedido.");
          setOrder(null);
          return;
        }

        setOrder(fetchedOrder);
      } catch (fetchError) {
        console.error(fetchError);
        setError("No se pudo cargar el pedido. Intenta nuevamente más tarde.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId, user?.uid]);
//si el usuario no ha iniciado sesión, muestra un mensaje indicando que debe iniciar sesión para ver los detalles del pedido.
  if (!user) {
    return (
      <main className="shop-home shipping-page">
        <section className="empty-state">
          <h2>Debes iniciar sesión</h2>
          <p>Inicia sesión para ver los detalles de tu pedido.</p>
        </section>
      </main>
    );
  }

  const formattedDate = order?.createdAt
    ? order.createdAt && typeof order.createdAt === "object" && "toDate" in order.createdAt
      ? (order.createdAt as { toDate: () => Date }).toDate().toLocaleString("es-CO")
      : String(order.createdAt)
    : "Fecha no disponible";

  return (
    <main className="shop-home shipping-page">
      <section className="home-section shipping-header-section">
        <div className="home-section-heading">
          <div>
            <h2>Detalle de envío</h2>
            <p>Revisa el estado y detalle de tu pedido.</p>
          </div>
          <button className="button" type="button" onClick={() => navigate("/envios")}>Volver a envíos</button>
        </div>
      </section>
// Muestra diferentes estados de la página según si está cargando, si hay un error, si no se encuentra el pedido o si se ha cargado correctamente. Si se ha cargado correctamente, muestra los detalles del pedido, incluyendo el estado, la fecha, la cantidad de productos, el envío y el total. También muestra una barra de progreso del envío y una lista de los productos incluidos en el pedido.
      {loading ? (
        <section className="empty-state">
          <p>Cargando pedido...</p>
        </section>
      ) : error ? (
        <section className="empty-state error-state">
          <h2>Error</h2>
          <p>{error}</p>
        </section>
      ) : !order ? (
        <section className="empty-state">
          <h2>Pedido no encontrado</h2>
          <p>Verifica que el enlace del pedido sea correcto.</p>
        </section>
      ) : (
        <section className="shop-grid">
          <div className="shop-main-column">
            <section className="home-section shipping-order-list">
              <article className="shipping-order-card">
                <div className="shipping-order-main">
                  <div className="shipping-order-details">
                    <div className="shipping-order-meta">
                      <span className={`shipping-badge ${order.status}`}>
                        {orderStatusLabels[order.status] ?? order.status}
                      </span>
                      <strong>Pedido #{order.id}</strong>
                    </div>
                    <p>{formattedDate}</p>
                    <p>{order.items.length} productos</p>
                    <p>{order.shipping}</p>
                  </div>

                  <div className="shipping-order-total">
                    <span>Total</span>
                    <strong>{currencyFormatter.format(order.total)}</strong>
                  </div>
                </div>

                <div className="shipping-progress-row">
                  {orderProgressSteps.map((step, index) => (
                    <div
                      className={`shipping-progress-step ${index === getActiveStep(order.status) ? "active" : ""}`}
                      key={`${order.id}-${step}`}
                    >
                      <span>{index + 1}</span>
                      <small>{step}</small>
                    </div>
                  ))}
                </div>
              </article>

              <section className="home-section shipping-order-items">
                <h3>Productos del pedido</h3>
                <div className="order-items-list">
                  {order.items.map((item) => (
                    <article className="order-item-card" key={item.id}>
                      <img src={item.imageUrl} alt={item.name} />
                      <div>
                        <h4>{item.name}</h4>
                        <p>{item.category}</p>
                        <p>Cantidad: {item.quantity}</p>
                        <p>{currencyFormatter.format(item.price)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}

export default OrderDetailPage;
