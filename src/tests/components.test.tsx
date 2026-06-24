import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock del componente ProductCard
interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  stock: number;
  onAddToCart: (quantity: number) => void;
  onViewDetails: () => void;
}

const MockProductCard = ({
  id,
  name,
  price,
  imageUrl,
  stock,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) => (
  <div data-testid={`product-card-${id}`}>
    <h3 data-testid="product-name">{name}</h3>
    <p data-testid="product-price">${price}</p>
    {imageUrl && <img data-testid="product-image" src={imageUrl} alt={name} />}
    <p data-testid="product-stock">Stock: {stock}</p>
    <button
      data-testid="add-to-cart-btn"
      onClick={() => onAddToCart(1)}
      disabled={stock === 0}
    >
      Agregar al carrito
    </button>
    <button data-testid="view-details-btn" onClick={onViewDetails}>
      Ver detalles
    </button>
  </div>
);

// Mock del componente ProductGrid
interface ProductGridProps {
  products: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    stock: number;
  }>;
  onAddToCart: (productId: string, quantity: number) => void;
  onViewDetails: (productId: string) => void;
}

const MockProductGrid = ({ products, onAddToCart, onViewDetails }: ProductGridProps) => (
  <div data-testid="product-grid">
    {products.map((product) => (
      <MockProductCard
        key={product.id}
        {...product}
        onAddToCart={(quantity) => onAddToCart(product.id, quantity)}
        onViewDetails={() => onViewDetails(product.id)}
      />
    ))}
  </div>
);

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    name: 'Laptop Gaming',
    price: 1500,
    imageUrl: 'https://example.com/laptop.jpg',
    stock: 10,
  };

  const mockHandlers = {
    onAddToCart: vi.fn(),
    onViewDetails: vi.fn(),
  };

  it('debería renderizar la tarjeta con información del producto', () => {
    render(
      <MockProductCard
        {...mockProduct}
        {...mockHandlers}
      />
    );

    expect(screen.getByTestId('product-name')).toHaveTextContent('Laptop Gaming');
    expect(screen.getByTestId('product-price')).toHaveTextContent('$1500');
    expect(screen.getByTestId('product-stock')).toHaveTextContent('Stock: 10');
  });

  it('debería mostrar la imagen del producto', () => {
    render(
      <MockProductCard
        {...mockProduct}
        {...mockHandlers}
      />
    );

    const image = screen.getByTestId('product-image') as HTMLImageElement;
    expect(image.src).toContain('laptop.jpg');
  });

  it('debería llamar onAddToCart cuando se hace click en el botón', () => {
    render(
      <MockProductCard
        {...mockProduct}
        {...mockHandlers}
      />
    );

    const addBtn = screen.getByTestId('add-to-cart-btn');
    fireEvent.click(addBtn);

    expect(mockHandlers.onAddToCart).toHaveBeenCalledWith(1);
  });

  it('debería llamar onViewDetails cuando se hace click en Ver detalles', () => {
    render(
      <MockProductCard
        {...mockProduct}
        {...mockHandlers}
      />
    );

    const detailsBtn = screen.getByTestId('view-details-btn');
    fireEvent.click(detailsBtn);

    expect(mockHandlers.onViewDetails).toHaveBeenCalled();
  });

  it('debería deshabilitar el botón cuando no hay stock', () => {
    render(
      <MockProductCard
        {...mockProduct}
        stock={0}
        {...mockHandlers}
      />
    );

    const addBtn = screen.getByTestId('add-to-cart-btn') as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
  });

  it('debería habilitar el botón cuando hay stock', () => {
    render(
      <MockProductCard
        {...mockProduct}
        stock={5}
        {...mockHandlers}
      />
    );

    const addBtn = screen.getByTestId('add-to-cart-btn') as HTMLButtonElement;
    expect(addBtn.disabled).toBe(false);
  });
});

describe('ProductGrid Component', () => {
  const mockProducts = [
    { id: '1', name: 'Laptop', price: 1500, stock: 10 },
    { id: '2', name: 'Mouse', price: 50, stock: 100 },
    { id: '3', name: 'Teclado', price: 120, stock: 50 },
  ];

  it('debería renderizar todas las tarjetas de productos', () => {
    const handlers = {
      onAddToCart: vi.fn(),
      onViewDetails: vi.fn(),
    };

    render(
      <MockProductGrid
        products={mockProducts}
        {...handlers}
      />
    );

    expect(screen.getByTestId('product-grid')).toBeInTheDocument();
    mockProducts.forEach((product) => {
      expect(screen.getByTestId(`product-card-${product.id}`)).toBeInTheDocument();
    });
  });

  it('debería renderizar 0 tarjetas cuando no hay productos', () => {
    const handlers = {
      onAddToCart: vi.fn(),
      onViewDetails: vi.fn(),
    };

    const { container } = render(
      <MockProductGrid
        products={[]}
        {...handlers}
      />
    );

    const grid = container.querySelector('[data-testid="product-grid"]');
    expect(grid?.children).toHaveLength(0);
  });

  it('debería pasar los handlers correctos a cada ProductCard', () => {
    const handlers = {
      onAddToCart: vi.fn(),
      onViewDetails: vi.fn(),
    };

    render(
      <MockProductGrid
        products={mockProducts}
        {...handlers}
      />
    );

    const firstProductCard = screen.getByTestId('product-card-1');
    const addBtn = firstProductCard.querySelector('[data-testid="add-to-cart-btn"]');

    fireEvent.click(addBtn!);

    expect(handlers.onAddToCart).toHaveBeenCalledWith('1', 1);
  });

  it('debería manejar múltiples clicks en diferentes productos', () => {
    const handlers = {
      onAddToCart: vi.fn(),
      onViewDetails: vi.fn(),
    };

    render(
      <MockProductGrid
        products={mockProducts}
        {...handlers}
      />
    );

    const addBtn1 = screen.getByTestId('product-card-1').querySelector('[data-testid="add-to-cart-btn"]');
    const addBtn2 = screen.getByTestId('product-card-2').querySelector('[data-testid="add-to-cart-btn"]');

    fireEvent.click(addBtn1!);
    fireEvent.click(addBtn2!);

    expect(handlers.onAddToCart).toHaveBeenCalledTimes(2);
    expect(handlers.onAddToCart).toHaveBeenNthCalledWith(1, '1', 1);
    expect(handlers.onAddToCart).toHaveBeenNthCalledWith(2, '2', 1);
  });
});
