type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

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
