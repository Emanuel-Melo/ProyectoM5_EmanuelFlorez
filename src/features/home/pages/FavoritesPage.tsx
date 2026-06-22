import { Link } from "react-router-dom";
import "./HomePage.css";

function FavoritesPage() {
  return (
    <main className="shop-home">
      <section className="shop-grid">
        <div className="shop-main-column">
          <section className="home-section">
            <div className="home-section-heading">
              <h2>Mis favoritos</h2>
            </div>
            <p>No tienes favoritos aún.</p>
            <Link to="/products">Explorar productos</Link>
          </section>
        </div>
      </section>
    </main>
  );
}

export default FavoritesPage;
