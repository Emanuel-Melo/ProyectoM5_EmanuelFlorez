import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ProductFilters } from "../components/ProductFilters";
import { ProductGrid } from "../components/ProductGrid";
import { SearchBar } from "../components/SearchBar";
import { useProducts } from "../hooks/useProducts";
import "../products.css";

const PRODUCTS_PER_PAGE = 15;

function ProductsPage() {
  const {
    categories,
    error,
    filteredProducts,
    filters,
    loading,
    resetFilters,
    searchTerm,
    setFilters,
    setSearchTerm,
  } = useProducts();

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [currentPage, filteredProducts]);

  const startItem = filteredProducts.length === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const endItem = Math.min(filteredProducts.length, currentPage * PRODUCTS_PER_PAGE);

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
          {filteredProducts.length === 0
            ? "Sin resultados"
            : `Mostrando ${startItem}-${endItem} de ${filteredProducts.length} productos`}
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
            <>
              <ProductGrid products={currentProducts} />

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default ProductsPage;
