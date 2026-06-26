import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../cart/context/CartContext";
import { useFavorites } from "../../favorites/context/FavoritesContext";
import { useProducts } from "../../products/hooks/useProducts";
import type { Product } from "../../products/types/product.types";
import "./HomePage.css";
// Esta función sirve para formatear los precios en pesos colombianos sin decimales.
const currencyFormatter = new Intl.NumberFormat("es-CO", {
  currency: "COP",
  maximumFractionDigits: 0,
  style: "currency",
});
// Esta función sirve para calcular el precio con descuento de un artículo, si tiene un porcentaje de descuento, redondeando el resultado al entero más cercano. Si no tiene descuento, devuelve el precio original.
const categoryLabels: Record<string, string> = {
  accessories: "Accesorios",
  audio: "Audio",
  gaming: "Gaming",
  laptops: "Laptops",
  monitors: "Monitores",
  smartphones: "Smartphones",
  tablets: "Tablets",
  wearables: "Wearables",
};

const categoryStyles = ["red", "blue", "green", "purple", "amber", "cyan"];
// Esta función sirve para formatear los precios en pesos colombianos sin decimales.
function ProductMiniCard({ product, favorite, onToggleFavorite }: { product: Product; favorite: boolean; onToggleFavorite: () => void }) {
  return (
    <article className="home-product-card">
      <Link className="home-product-image" to={`/products/${product.id}`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span>BUY</span>
        )}
      </Link>
      <button
        className={`home-favorite-button ${favorite ? "favorite-selected" : ""}`}
        type="button"
        aria-label={favorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
        onClick={onToggleFavorite}
      >
        {favorite ? "❤️" : "🩶"}
      </button>
      <div className="home-product-content">
        <h3>{product.name}</h3>
        <span>{product.category}</span>
        <strong>{currencyFormatter.format(product.price)}</strong>
        <p>***** ({Math.max(product.stock, 4)})</p>
      </div>
    </article>
  );
}
// Devuelve la representación visual de la página de inicio, mostrando secciones de categorías populares, productos destacados, beneficios y un resumen de pedidos y favoritos. Permite al usuario explorar productos, ver detalles y gestionar favoritos.
function HomePage() {
  const { categories, products, loading } = useProducts();
  const { count } = useCart();
  const { items: favoriteItems, isFavorite, toggleFavorite } = useFavorites();

  const visibleProducts = useMemo(() => products.slice(0, 4), [products]);

  const categoryCards = useMemo(
    () =>
      categories.slice(0, 6).map((category, index) => ({
        category,
        count: products.filter((product) => product.category === category).length,
        tone: categoryStyles[index % categoryStyles.length],
      })),
    [categories, products]
  );

  const favorites = favoriteItems.slice(0, 3);

  return (
    <main className="shop-home">
      <section className="shop-grid">
        <div className="shop-main-column">
          <section className="shop-hero">
            <div className="shop-hero-copy">
              <Link className="hero-cart-banner" to="/cart">
                <span className="hero-cart-icon" aria-hidden="true" />
                <div>
                  <strong>{count} {count === 1 ? "producto" : "productos"}</strong>
                  <small>{count ? "Listo para finalizar tu compra" : "Aún no has agregado productos"}</small>
                </div>
              </Link>

              <h1>
                Tecnologia que impulsa <span>tu mundo</span>
              </h1>
              <p>
                Descubre productos premium con la mejor calidad y al mejor
                precio.
              </p>
              <Link className="button" to="/products">
                Explorar productos
              </Link>
            </div>
            <div className="shop-hero-device" aria-hidden="true">
              <div className="device-phone" />
              <div className="device-screen" />
              <div className="device-headset" />
            </div>
          </section>

          <section className="home-section">
            <div className="home-section-heading">
              <h2>Categorias populares</h2>
              <Link to="/products">Ver todas</Link>
            </div>
            <div className="home-category-row">
              {categoryCards.map((item) => (
                <Link
                  className={`home-category-card ${item.tone}`}
                  key={item.category}
                  to="/products"
                >
                  <span className="home-category-icon" />
                  <strong>{categoryLabels[item.category] ?? item.category}</strong>
                  <small>{item.count} productos</small>
                </Link>
              ))}
            </div>
          </section>

          <section className="home-section">
            <div className="home-section-heading">
              <h2>Productos destacados</h2>
              <Link to="/products">Ver todos</Link>
            </div>
            {loading ? (
              <p className="home-status">Cargando productos...</p>
            ) : (
              <div className="home-products-row">
                {visibleProducts.map((product) => (
                  <ProductMiniCard
                    key={product.id}
                    product={product}
                    favorite={isFavorite(product.id)}
                    onToggleFavorite={() => toggleFavorite(product)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="home-benefits">
            <article>
              <span className="benefit-icon red" />
              <div>
                <strong>Envios rapidos</strong>
                <p>Recibe tus productos en 24-48 horas</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon blue" />
              <div>
                <strong>Pago seguro</strong>
                <p>Tus pagos estan protegidos con encriptacion SSL</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon green" />
              <div>
                <strong>Garantia oficial</strong>
                <p>Todos nuestros productos con garantia</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon purple" />
              <div>
                <strong>Soporte 24/7</strong>
                <p>Estamos aqui para ayudarte siempre</p>
              </div>
            </article>
          </section>
        </div>

        <aside className="shop-side-column">
          <section className="home-side-card orders-card">
            <h2>Mis pedidos</h2>
            <ul>
              <li>
                <span className="order-dot blue" />
                <strong>En camino</strong>
                <small>2 pedidos</small>
              </li>
              <li>
                <span className="order-dot green" />
                <strong>Entregados</strong>
                <small>5 pedidos</small>
              </li>
              <li>
                <span className="order-dot amber" />
                <strong>Procesando</strong>
                <small>1 pedido</small>
              </li>
              <li>
                <span className="order-dot red" />
                <strong>Cancelados</strong>
                <small>0 pedidos</small>
              </li>
            </ul>
            <Link to="/products">Ver todos los pedidos</Link>
          </section>

          <section className="home-offer-card">
            <div>
              <span>Ofertas especiales</span>
              <h2>Hasta 30% de descuento</h2>
              <p>En productos seleccionados</p>
              <Link className="button" to="/products">
                Ver ofertas
              </Link>
            </div>
          </section>

          <section className="home-side-card favorites-card">
            <div className="favorites-side-header">
              <h2>Mis favoritos</h2>
              <span>{favoriteItems.length} guardados</span>
            </div>
            <div className="favorite-list">
              {favorites.map((product: Product) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <img src={product.imageUrl} alt={product.name} loading="lazy" />
                  <span>
                    <strong>{product.name}</strong>
                    <small>{currencyFormatter.format(product.price)}</small>
                  </span>
                  <b aria-hidden="true" />
                </Link>
              ))}
              {favorites.length === 0 && (
                <p className="favorite-empty">Aún no agregas favoritos.</p>
              )}
            </div>
            <Link to="/favorites">Ver todos los favoritos</Link>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default HomePage;
