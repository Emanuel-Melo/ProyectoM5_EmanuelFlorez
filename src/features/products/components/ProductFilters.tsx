import type { ProductFiltersState } from "../types/product.types";

type ProductFiltersProps = {
  categories: string[];
  filters: ProductFiltersState;
  onChange: (filters: ProductFiltersState) => void;
  onReset: () => void;
};

const formatCategory = (category: string) =>
  category.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function ProductFilters({
  categories,
  filters,
  onChange,
  onReset,
}: ProductFiltersProps) {
  return (
    <aside className="product-filters" aria-label="Filtros de productos">
      <div className="product-filters-heading">
        <h2>Filtros</h2>
        <button className="text-button" type="button" onClick={onReset}>
          Limpiar
        </button>
      </div>

      <label className="filter-field">
        <span>Categoria</span>
        <select
          value={filters.category}
          onChange={(event) =>
            onChange({ ...filters, category: event.target.value })
          }
        >
          <option value="all">Todas</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {formatCategory(category)}
            </option>
          ))}
        </select>
      </label>

      <div className="filter-range">
        <label className="filter-field">
          <span>Precio min.</span>
          <input
            min="0"
            type="number"
            value={filters.minPrice}
            onChange={(event) =>
              onChange({ ...filters, minPrice: event.target.value })
            }
          />
        </label>

        <label className="filter-field">
          <span>Precio max.</span>
          <input
            min="0"
            type="number"
            value={filters.maxPrice}
            onChange={(event) =>
              onChange({ ...filters, maxPrice: event.target.value })
            }
          />
        </label>
      </div>

      <label className="filter-toggle">
        <input
          type="checkbox"
          checked={filters.onlyInStock}
          onChange={(event) =>
            onChange({ ...filters, onlyInStock: event.target.checked })
          }
        />
        <span>Solo disponibles</span>
      </label>
    </aside>
  );
}
