import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Validación de tipos de producto
const ProductSchema = z.object({
  id: z.string().min(1, 'ID es requerido'),
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional(),
  price: z.number().positive('Precio debe ser positivo'),
  stock: z.number().min(0, 'Stock no puede ser negativo'),
  category: z.string().min(1, 'Categoría es requerida'),
  imageUrl: z.string().url('URL de imagen inválida').optional(),
  active: z.boolean().default(true),
  discountPercent: z.number().min(0).max(100).optional(),
});

// Validación de orden
const OrderSchema = z.object({
  userId: z.string().min(1, 'ID de usuario es requerido'),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number().positive(),
      quantity: z.number().positive().max(3),
      discountPercent: z.number().min(0).max(100).optional(),
    })
  ),
  total: z.number().positive(),
  discount: z.number().min(0).default(0),
  shipping: z.string().default('Gratis'),
  status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
});

// Validación de usuario
const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email('Email inválido'),
  displayName: z.string().optional(),
  cart: z.array(z.any()).default([]),
  favorites: z.array(z.string()).default([]),
  orders: z.array(z.string()).default([]),
});

describe('Product Validation', () => {
  it('debería validar un producto válido', () => {
    const validProduct = {
      id: '1',
      name: 'Laptop',
      description: 'Laptop potente',
      price: 1500,
      stock: 10,
      category: 'Electrónica',
      imageUrl: 'https://example.com/laptop.jpg',
      active: true,
    };

    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('debería rechazar precio negativo', () => {
    const invalidProduct = {
      id: '1',
      name: 'Laptop',
      price: -100,
      stock: 10,
      category: 'Electrónica',
    };

    const result = ProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('debería rechazar descuento mayor a 100%', () => {
    const invalidProduct = {
      id: '1',
      name: 'Laptop',
      price: 1500,
      stock: 10,
      category: 'Electrónica',
      discountPercent: 150,
    };

    const result = ProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('debería aceptar descuento entre 0 y 100', () => {
    const validProduct = {
      id: '1',
      name: 'Laptop',
      price: 1500,
      stock: 10,
      category: 'Electrónica',
      discountPercent: 25,
    };

    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });
});

describe('Order Validation', () => {
  it('debería validar una orden válida', () => {
    const validOrder = {
      userId: 'user123',
      items: [
        { id: '1', name: 'Producto', price: 100, quantity: 2 },
      ],
      total: 200,
      status: 'processing',
    };

    const result = OrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('debería rechazar cantidad mayor a 3', () => {
    const invalidOrder = {
      userId: 'user123',
      items: [
        { id: '1', name: 'Producto', price: 100, quantity: 5 },
      ],
      total: 500,
      status: 'processing',
    };

    const result = OrderSchema.safeParse(invalidOrder);
    expect(result.success).toBe(false);
  });

  it('debería rechazar estado inválido', () => {
    const invalidOrder = {
      userId: 'user123',
      items: [
        { id: '1', name: 'Producto', price: 100, quantity: 1 },
      ],
      total: 100,
      status: 'invalid_status',
    };

    const result = OrderSchema.safeParse(invalidOrder);
    expect(result.success).toBe(false);
  });
});

describe('User Validation', () => {
  it('debería validar un usuario válido', () => {
    const validUser = {
      uid: 'user123',
      email: 'user@example.com',
      displayName: 'John Doe',
    };

    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('debería rechazar email inválido', () => {
    const invalidUser = {
      uid: 'user123',
      email: 'invalid-email',
    };

    const result = UserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });

  it('debería establecer valores por defecto', () => {
    const user = {
      uid: 'user123',
      email: 'user@example.com',
    };

    const result = UserSchema.safeParse(user);
    if (result.success) {
      expect(result.data.cart).toEqual([]);
      expect(result.data.favorites).toEqual([]);
      expect(result.data.orders).toEqual([]);
    }
  });
});
