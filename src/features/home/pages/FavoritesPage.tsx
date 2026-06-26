import { Link } from "react-router-dom";
import { useFavorites } from "../../favorites/context/FavoritesContext";
import { useCart } from "../../cart/context/CartContext";
import type { Product } from "../../products/types/product.types";
import "./HomePage.css";

function FavoritesPage() {
  const { items, removeFavorite, clearFavorites } = useFavorites();
  const { addItem } = useCart();
// Devuelve la representación visual de la página de favoritos, mostrando los productos guardados por el usuario. Permite al usuario mover productos al carrito, eliminar productos de favoritos y limpiar todos los favoritos. Si no hay favoritos, muestra un mensaje indicando que no hay productos guardados.
  const moveToCart = (product: Product) => {
    addItem(product, 1);
    removeFavorite(product.id);
  };
// Mueve todos los productos favoritos al carrito y limpia la lista de favoritos.
  const moveAllToCart = () => {
    items.forEach((product: Product) => addItem(product, 1));
    clearFavorites();
  };
// Devuelve la representación visual de la página de favoritos, mostrando los productos guardados por el usuario. Permite al usuario mover productos al carrito, eliminar productos de favoritos y limpiar todos los favoritos. Si no hay favoritos, muestra un mensaje indicando que no hay productos guardados.
  return (
    <main className="shop-home favorites-page">
      <section className="shop-grid">
        <div className="shop-main-column">
          <section className="home-section favorites-list-section">
            <div className="home-section-heading">
              <div>
                <h2>Mis favoritos</h2>
                <p>Productos que has guardado para después</p>
              </div>
              <div className="favorites-actions-header">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={clearFavorites}
                  disabled={items.length === 0}
                >
                  Limpiar favoritos
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="products-empty">
                <h2>No tienes favoritos aún.</h2>
                <p>Aquí aparecerán los productos que marques con ❤️.</p>
                <Link className="button" to="/products">
                  Explorar productos
                </Link>
              </div>
            ) : (
              <div className="favorite-grid">
                {items.map((product: Product) => (
                  <article className="favorite-card" key={product.id}>
                    <Link className="favorite-card-media" to={`/products/${product.id}`}>
                      <img src={product.imageUrl} alt={product.name} loading="lazy" />
                    </Link>
                    <div className="favorite-card-body">
                      <div>
                        <span>{product.category}</span>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                      </div>
                      <div className="favorite-card-footer">
                        <strong>{new Intl.NumberFormat("es-CO", {
                          currency: "COP",
                          maximumFractionDigits: 0,
                          style: "currency",
                        }).format(product.price)}</strong>
                        <div className="favorite-card-actions">
                          <button
                            type="button"
                            className="button"
                            onClick={() => moveToCart(product)}
                          >
                            Mover al carrito
                          </button>
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => removeFavorite(product.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="shop-side-column">
          <section className="home-side-card favorites-summary-card">
            <h2>Acciones rápidas</h2>
            <button
              type="button"
              className="quick-action"
              onClick={moveAllToCart}
              disabled={items.length === 0}
            >
              Mover todos al carrito
            </button>
            <button
              type="button"
              className="quick-action button-secondary"
              onClick={clearFavorites}
              disabled={items.length === 0}
            >
              Limpiar favoritos
            </button>
          </section>
          <section className="home-side-card help-card">
            <h2>¿Necesitas ayuda?</h2>
            <p>Si tienes dudas sobre algún producto, nuestro equipo está para ayudarte.</p>
            <Link className="button button-secondary" to="/products">
              Ver catálogo
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default FavoritesPage;
