import { Link } from "react-router-dom";

import { ProductFilters } from "../components/ProductFilters";
import { ProductGrid } from "../components/ProductGrid";
import { SearchBar } from "../components/SearchBar";
import { useProducts } from "../hooks/useProducts";
import "../products.css";

function ProductsPage() {
  const {
    categories,
    error,
    filteredProducts,
    filters,
    loading,
    products,
    resetFilters,
    searchTerm,
    setFilters,
    setSearchTerm,
  } = useProducts();

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <div>
          <p className="eyebrow">Catalogo Buy</p>
          <h1>Productos</h1>
          <p>
            Explora el inventario, filtra por categoria y abre el detalle de cada
            producto.
          </p>
        </div>

        <Link className="button button-secondary" to="/home">
          Volver
        </Link>
      </header>

      <section className="catalog-toolbar">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <p>
          {filteredProducts.length} de {products.length} productos
        </p>
      </section>

      {error && <p className="error-message">{error}</p>}

      <section className="catalog-content">
        <ProductFilters
          categories={categories}
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
        />

        <div className="catalog-results">
          {loading ? (
            <p className="catalog-status">Cargando productos...</p>
          ) : (
            <ProductGrid products={filteredProducts} />
          )}
        </div>
      </section>
    </main>
  );
}

export default ProductsPage;
