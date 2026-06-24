import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";
import { fetchOrdersByUser, type OrderSummary } from "../../orders/services/orderService";
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

const orderStatusBadgeClasses: Record<string, string> = {
  pending: "cyan",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  canceled: "red",
};

const orderProgressSteps = ["Procesando", "En camino", "En entrega", "Entregado"];

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

type ShippingFilter = "all" | "shipped" | "delivered" | "processing" | "canceled";

function ShippingPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ShippingFilter>("all");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setOrders([]);
      return;
    }

    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const userOrders = await fetchOrdersByUser(user.uid);
        setOrders(userOrders);
      } catch (fetchError) {
        console.error(fetchError);
        setError("No se pudieron cargar tus pedidos. Intenta nuevamente más tarde.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, [user?.uid]);

  const filteredOrders = useMemo(() => {
    switch (filter) {
      case "shipped":
        return orders.filter((order) => order.status === "shipped");
      case "delivered":
        return orders.filter((order) => order.status === "delivered");
      case "processing":
        return orders.filter((order) => order.status === "processing");
      case "canceled":
        return orders.filter((order) => order.status === "canceled");
      default:
        return orders;
    }
  }, [filter, orders]);

  const summaryCounts = useMemo(
    () =>
      orders.reduce(
        (summary, order) => {
          summary[order.status] = (summary[order.status] ?? 0) + 1;
          return summary;
        },
        {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          canceled: 0,
        } as Record<string, number>
      ),
    [orders]
  );

  return (
    <main className="shop-home shipping-page">
      <section className="shop-grid">
        <div className="shop-main-column">
          <section className="home-section shipping-header-section">
            <div className="home-section-heading">
              <div>
                <h2>Mis envíos</h2>
                <p>Controla el estado de tus pedidos y mantente informado en cada etapa.</p>
              </div>
              <Link className="button" to="/home">
                Volver al inicio
              </Link>
            </div>
          </section>

          <section className="home-section shipping-tabs">
            <button
              type="button"
              className={`tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Todos
            </button>
            <button
              type="button"
              className={`tab ${filter === "shipped" ? "active" : ""}`}
              onClick={() => setFilter("shipped")}
            >
              En camino
            </button>
            <button
              type="button"
              className={`tab ${filter === "delivered" ? "active" : ""}`}
              onClick={() => setFilter("delivered")}
            >
              Entregados
            </button>
            <button
              type="button"
              className={`tab ${filter === "processing" ? "active" : ""}`}
              onClick={() => setFilter("processing")}
            >
              Procesando
            </button>
            <button
              type="button"
              className={`tab ${filter === "canceled" ? "active" : ""}`}
              onClick={() => setFilter("canceled")}
            >
              Cancelados
            </button>
            <div className="shipping-sort">
              <span>Ordenar por:</span>
              <select>
                <option>Más reciente</option>
                <option>Más antiguo</option>
                <option>Estado</option>
              </select>
            </div>
          </section>

          <section className="home-section shipping-order-list">
            {loading ? (
              <div className="empty-state">
                <p>Cargando pedidos...</p>
              </div>
            ) : error ? (
              <div className="empty-state error-state">
                <p>{error}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <h2>No se encontraron pedidos para este filtro</h2>
                <p>Cambia la selección para ver pedidos en otro estado.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const badgeClass = orderStatusBadgeClasses[order.status] ?? "cyan";
                const activeStep = getActiveStep(order.status);
                const itemCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

                return (
                  <article className="shipping-order-card" key={order.id}>
                    <div className="shipping-order-main">
                      <div className="shipping-order-details">
                        <div className="shipping-order-meta">
                          <span className={`shipping-badge ${badgeClass}`}>
                            {orderStatusLabels[order.status] ?? order.status}
                          </span>
                          <strong>Pedido #{order.id}</strong>
                        </div>
                        <p>{order.createdAt ? String(order.createdAt) : "Fecha no disponible"}</p>
                        <p>{itemCount} productos</p>
                        <p>{order.shipping}</p>
                      </div>

                      <div className="shipping-order-total">
                        <span>Total</span>
                        <strong>{currencyFormatter.format(order.total)}</strong>
                        <Link className="button button-secondary" to={`/envios/${order.id}`}>
                          Ver detalles
                        </Link>
                      </div>
                    </div>

                    <div className="shipping-progress-row">
                      {orderProgressSteps.map((step, index) => (
                        <div
                          className={`shipping-progress-step ${index === activeStep ? "active" : ""}`}
                          key={`${order.id}-${step}`}
                        >
                          <span>{index + 1}</span>
                          <small>{step}</small>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>

        <aside className="shop-side-column">
          <section className="home-side-card shipping-summary-card">
            <div className="summary-header">
              <div>
                <h2>Resumen de envíos</h2>
                <p>Revisa rápidamente el estado actual de tus pedidos.</p>
              </div>
            </div>
            <dl className="summary-list">
              <div>
                <dt>En camino</dt>
                <dd>{summaryCounts.shipped}</dd>
              </div>
              <div>
                <dt>Procesando</dt>
                <dd>{summaryCounts.processing}</dd>
              </div>
              <div>
                <dt>Entregados</dt>
                <dd>{summaryCounts.delivered}</dd>
              </div>
              <div>
                <dt>Cancelados</dt>
                <dd>{summaryCounts.canceled}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default ShippingPage;
