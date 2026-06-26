type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};
// Devuelve la representación visual de la barra de búsqueda de productos, permitiendo al usuario buscar productos por nombre, descripción o categoría. Incluye un campo de entrada de tipo "search" y un placeholder que indica los criterios de búsqueda disponibles.
export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="product-search">
      <span>Buscar productos</span>
      <input
        type="search"
        value={value}
        placeholder="Nombre, descripcion o categoria"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
