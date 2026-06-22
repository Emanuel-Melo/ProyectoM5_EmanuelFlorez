import { Link } from "react-router-dom";
import "./HomePage.css";

function CartPage() {
  return (
    <main className="shop-home">
      <section className="shop-grid">
        <div className="shop-main-column">
          <section className="home-section">
            <div className="home-section-heading">
              <h2>Carrito</h2>
            </div>
            <p>Tu carrito está vacío.</p>
            <Link to="/products">Seguir comprando</Link>
          </section>
        </div>
      </section>
    </main>
  );
}

export default CartPage;
