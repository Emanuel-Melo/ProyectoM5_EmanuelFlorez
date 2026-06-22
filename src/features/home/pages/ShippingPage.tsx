import { Link } from "react-router-dom";
import "./HomePage.css";

function ShippingPage() {
  return (
    <main className="shop-home">
      <section className="shop-grid">
        <div className="shop-main-column">
          <section className="home-section">
            <div className="home-section-heading">
              <h2>Envios</h2>
            </div>
            <p>Informacion sobre envíos y seguimiento.</p>
            <Link to="/home">Volver</Link>
          </section>
        </div>
      </section>
    </main>
  );
}

export default ShippingPage;
