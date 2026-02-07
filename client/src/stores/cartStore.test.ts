import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';

describe('cartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({ items: [] });
  });

  it('should add item to cart', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 1,
      productName: 'Test Product',
      price: 80000,
      quantity: 1,
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual({
      productId: 1,
      productName: 'Test Product',
      price: 80000,
      quantity: 1,
    });
  });

  it('should increase quantity if item already exists', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 1,
      productName: 'Test Product',
      price: 80000,
      quantity: 1,
    });
    store.addItem({
      productId: 1,
      productName: 'Test Product',
      price: 80000,
      quantity: 2,
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(3);
  });

  it('should remove item from cart', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 1,
      productName: 'Test Product',
      price: 80000,
      quantity: 1,
    });
    store.removeItem(1);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
  });

  it('should update quantity', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 1,
      productName: 'Test Product',
      price: 80000,
      quantity: 1,
    });
    store.updateQuantity(1, 5);

    const state = useCartStore.getState();
    expect(state.items[0]?.quantity).toBe(5);
  });

  it('should calculate total price correctly', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 1,
      productName: 'Product 1',
      price: 80000,
      quantity: 2,
    });
    store.addItem({
      productId: 2,
      productName: 'Product 2',
      price: 120000,
      quantity: 1,
    });

    const totalPrice = store.getTotalPrice();
    expect(totalPrice).toBe(80000 * 2 + 120000); // 280000
  });

  it('should calculate total items correctly', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 1,
      productName: 'Product 1',
      price: 80000,
      quantity: 2,
    });
    store.addItem({
      productId: 2,
      productName: 'Product 2',
      price: 120000,
      quantity: 3,
    });

    const totalItems = store.getTotalItems();
    expect(totalItems).toBe(5);
  });

  it('should clear cart', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 1,
      productName: 'Test Product',
      price: 80000,
      quantity: 1,
    });
    store.clearCart();

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
  });

  it('should handle multiple items correctly', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 1,
      productName: 'Product 1',
      price: 80000,
      quantity: 1,
    });
    store.addItem({
      productId: 2,
      productName: 'Product 2',
      price: 120000,
      quantity: 2,
    });
    store.addItem({
      productId: 3,
      productName: 'Product 3',
      price: 50000,
      quantity: 1,
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(3);
    expect(state.getTotalItems()).toBe(4);
    expect(state.getTotalPrice()).toBe(80000 + 120000 * 2 + 50000);
  });
});
