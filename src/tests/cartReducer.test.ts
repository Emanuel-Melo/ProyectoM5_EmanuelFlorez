import { describe, it, expect } from 'vitest';

// Simulación del cart reducer
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find((item) => item.id === action.payload.id);
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: Math.min(item.quantity + action.payload.quantity, 3) }
              : item
          ),
        };
      }
      return {
        items: [...state.items, { ...action.payload, quantity: Math.min(action.payload.quantity, 3) }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        items: state.items.filter((item) => item.id !== action.payload),
      };

    case 'UPDATE_QUANTITY':
      return {
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.min(Math.max(action.payload.quantity, 0), 3) }
            : item
        ),
      };

    case 'CLEAR_CART':
      return {
        items: [],
      };

    default:
      return state;
  }
};

describe('cartReducer', () => {
  const initialState: CartState = { items: [] };

  it('debería agregar un producto al carrito', () => {
    const item: CartItem = { id: '1', name: 'Producto', price: 100, quantity: 1 };
    const result = cartReducer(initialState, { type: 'ADD_ITEM', payload: item });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(item);
  });

  it('debería incrementar la cantidad si el producto ya existe', () => {
    const state: CartState = {
      items: [{ id: '1', name: 'Producto', price: 100, quantity: 1 }],
    };
    const item: CartItem = { id: '1', name: 'Producto', price: 100, quantity: 1 };
    const result = cartReducer(state, { type: 'ADD_ITEM', payload: item });

    expect(result.items[0].quantity).toBe(2);
  });

  it('no debería permitir cantidad mayor a 3', () => {
    const state: CartState = {
      items: [{ id: '1', name: 'Producto', price: 100, quantity: 2 }],
    };
    const item: CartItem = { id: '1', name: 'Producto', price: 100, quantity: 2 };
    const result = cartReducer(state, { type: 'ADD_ITEM', payload: item });

    expect(result.items[0].quantity).toBe(3);
  });

  it('debería remover un producto del carrito', () => {
    const state: CartState = {
      items: [
        { id: '1', name: 'Producto1', price: 100, quantity: 1 },
        { id: '2', name: 'Producto2', price: 200, quantity: 1 },
      ],
    };
    const result = cartReducer(state, { type: 'REMOVE_ITEM', payload: '1' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('2');
  });

  it('debería actualizar la cantidad de un producto', () => {
    const state: CartState = {
      items: [{ id: '1', name: 'Producto', price: 100, quantity: 1 }],
    };
    const result = cartReducer(state, { type: 'UPDATE_QUANTITY', payload: { id: '1', quantity: 3 } });

    expect(result.items[0].quantity).toBe(3);
  });

  it('no debería permitir cantidad negativa', () => {
    const state: CartState = {
      items: [{ id: '1', name: 'Producto', price: 100, quantity: 2 }],
    };
    const result = cartReducer(state, { type: 'UPDATE_QUANTITY', payload: { id: '1', quantity: -1 } });

    expect(result.items[0].quantity).toBe(0);
  });

  it('debería limpiar el carrito', () => {
    const state: CartState = {
      items: [
        { id: '1', name: 'Producto1', price: 100, quantity: 1 },
        { id: '2', name: 'Producto2', price: 200, quantity: 2 },
      ],
    };
    const result = cartReducer(state, { type: 'CLEAR_CART' });

    expect(result.items).toHaveLength(0);
  });

  it('debería mantener el estado si la acción es desconocida', () => {
    const state: CartState = {
      items: [{ id: '1', name: 'Producto', price: 100, quantity: 1 }],
    };
    const result = cartReducer(state, { type: 'UNKNOWN_ACTION' as any });

    expect(result).toEqual(state);
  });
});
