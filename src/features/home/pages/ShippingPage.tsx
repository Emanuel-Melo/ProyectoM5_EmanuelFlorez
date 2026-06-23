import { Link } from "react-router-dom";
import "./HomePage.css";

const shippingOrders = [
  {
    id: "PB-000124",
    status: "En camino",
    statusTone: "blue",
    date: "20 Mayo 2024",
    time: "10:30 a.m.",
    total: 2549.97,
    items: 3,
    description: "Pedido entregado en ruta con fecha estimada de llegada",
    progress: ["Procesando", "En camino", "En entrega", "Entregado"],
    activeStep: 1,
    badge: "En camino",
  },
  {
    id: "PB-000123",
    status: "Procesando",
    statusTone: "cyan",
    date: "18 Mayo 2024",
    time: "02:15 p.m.",
    total: 249.99,
    items: 1,
    description: "Estamos preparando tu pedido para enviarlo pronto.",
    progress: ["Procesando", "En camino", "En entrega", "Entregado"],
    activeStep: 0,
    badge: "Procesando",
  },
  {
    id: "PB-000122",
    status: "Entregado",
    statusTone: "purple",
    date: "15 Mayo 2024",
    time: "09:45 a.m.",
    total: 1099.99,
    items: 1,
    description: "Pedido entregado correctamente el 17 de Mayo.",
    progress: ["Procesando", "En camino", "En entrega", "Entregado"],
    activeStep: 3,
    badge: "Entregado",
  },
  {
    id: "PB-000121",
    status: "Cancelado",
    statusTone: "red",
    date: "12 Mayo 2024",
    time: "04:20 p.m.",
    total: 399.99,
    items: 1,
    description: "El pedido fue cancelado y el pago será reembolsado.",
    progress: ["Procesando", "En camino", "En entrega", "Entregado"],
    activeStep: 0,
    badge: "Cancelado",
  },
];

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function ShippingPage() {
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
            <button type="button" className="tab active">Todos</button>
            <button type="button" className="tab">En camino</button>
            <button type="button" className="tab">Entregados</button>
            <button type="button" className="tab">Procesando</button>
            <button type="button" className="tab">Cancelados</button>
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
            {shippingOrders.map((order) => (
              <article className="shipping-order-card" key={order.id}>
                <div className="shipping-order-main">
                  <div className="shipping-order-details">
                    <div className="shipping-order-meta">
                      <span className={`shipping-badge ${order.statusTone}`}>{order.badge}</span>
                      <strong>Pedido #{order.id}</strong>
                    </div>
                    <p>{order.date} · {order.time}</p>
                    <p>{order.items} productos</p>
                    <p>{order.description}</p>
                  </div>

                  <div className="shipping-order-total">
                    <span>Total</span>
                    <strong>{currencyFormatter.format(order.total)}</strong>
                    <Link className="button button-secondary" to="/products">
                      Ver detalles
                    </Link>
                  </div>
                </div>

                <div className="shipping-progress-row">
                  {order.progress.map((step, index) => (
                    <div
                      className={`shipping-progress-step ${index <= order.activeStep ? "active" : ""}`}
                      key={`${order.id}-${step}`}
                    >
                      <span>{index + 1}</span>
                      <small>{step}</small>
                    </div>
                  ))}
                </div>
              </article>
            ))}
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
                <dd>2</dd>
              </div>
              <div>
                <dt>Procesando</dt>
                <dd>1</dd>
              </div>
              <div>
                <dt>Entregados</dt>
                <dd>3</dd>
              </div>
              <div>
                <dt>Cancelados</dt>
                <dd>1</dd>
              </div>
            </dl>
            <Link className="button button-secondary" to="/contact">
              Ver historial completo
            </Link>
          </section>

          <section className="home-side-card shipping-help-card">
            <h2>¿Necesitas ayuda?</h2>
            <p>Si tienes dudas sobre tu envío o tu pedido, estamos listos para ayudarte.</p>
            <Link className="button button-secondary" to="/contact">
              Contactar soporte
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default ShippingPage;
