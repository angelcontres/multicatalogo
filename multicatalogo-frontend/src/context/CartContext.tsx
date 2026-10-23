// src/context/CartContext.tsx
import { useState, useEffect, type ReactNode } from 'react';
import type { Producto } from '../data/productos';
import { useAuth } from './auth';
import { CartContext, type CartItem } from './cart';

interface CartProviderProps {
  children: ReactNode;
}

const CART_STORAGE_PREFIX = "multicatalogo_carrito_";

const DEFAULT_CART_ITEMS: Record<string, CartItem[]> = {
  "admin@upse.edu.ec": [
    { id: 1, nombre: "Serum Revitalizante", descripcion: "Serum concentrado con vitamina C pura", precio: 45.00, cantidad: 2, categoria: "Serum", img: "https://picsum.photos/seed/serum/600", galeria: [] },
    { id: 2, nombre: "Crema Hidratante Pro", descripcion: "Crema facial sedosa con niacinamida", precio: 32.50, cantidad: 1, categoria: "Crema", img: "https://picsum.photos/seed/crema/600", galeria: [] },
  ],
  "cliente@upse.edu.ec": [
    { id: 3, nombre: "Tónico Purificante", descripcion: "Tónico astringente sin alcohol", precio: 28.00, cantidad: 1, categoria: "Tónico", img: "https://picsum.photos/seed/tonico/600", galeria: [] },
    { id: 4, nombre: "Mascarilla Nocturna", descripcion: "Tratamiento nocturno reparador", precio: 50.00, cantidad: 1, categoria: "Mascarilla", img: "https://picsum.photos/seed/mascarilla/600", galeria: [] },
  ],
  "ana@upse.edu.ec": [
    { id: 8, nombre: "Kit Rutina Completa", descripcion: "Kit dermatológico de 4 pasos esenciales", precio: 129.00, cantidad: 1, categoria: "Kit", img: "https://picsum.photos/seed/kit/600", galeria: [] },
  ],
  "carlos@upse.edu.ec": [
    { id: 5, nombre: "Serum Anti-Edad Retinol", descripcion: "Serum nocturno con retinol encapsulado", precio: 58.00, cantidad: 1, categoria: "Serum", img: "https://picsum.photos/seed/retinol/600", galeria: [] },
    { id: 9, nombre: "Protector Solar Facial SPF 50+", descripcion: "Fluido solar invisible con toque seco", precio: 36.00, cantidad: 1, categoria: "Protector", img: "https://picsum.photos/seed/solar/600", galeria: [] },
  ],
  "marta@upse.edu.ec": [
    { id: 16, nombre: "Bruma Hidratante Poliglutámica", descripcion: "Spray facial ultrafino de alta absorción", precio: 30.00, cantidad: 2, categoria: "Tónico", img: "https://picsum.photos/seed/mist/600", galeria: [] },
  ],
  "valeria@upse.edu.ec": [
    { id: 18, nombre: "Kit Glow Intensivo", descripcion: "Tratamiento duo con serum revitalizante", precio: 78.00, cantidad: 1, categoria: "Kit", img: "https://picsum.photos/seed/glowkit/600", galeria: [] },
  ],
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const { user } = useAuth();

  const storageKey = user
    ? `${CART_STORAGE_PREFIX}${user.email}`
    : `${CART_STORAGE_PREFIX}anonimo`;

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        return JSON.parse(saved) as CartItem[];
      }
      if (user && DEFAULT_CART_ITEMS[user.email]) {
        return DEFAULT_CART_ITEMS[user.email];
      }
      return DEFAULT_CART_ITEMS["cliente@upse.edu.ec"] || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey]);

  const loadSampleItems = () => {
    const sample = (user && DEFAULT_CART_ITEMS[user.email])
      ? DEFAULT_CART_ITEMS[user.email]
      : DEFAULT_CART_ITEMS["cliente@upse.edu.ec"];
    setCart(sample);
  };

  const addToCart = (producto: Producto) => {
    setCart((prevCart) => {
      const itemExists = prevCart.find((item) => item.id === producto.id);
      if (itemExists) {
        return prevCart.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prevCart, { ...producto, cantidad: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const incrementQuantity = (id: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item
      )
    );
  };

  const decrementQuantity = (id: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((total, item) => total + item.cantidad, 0);
  const totalPrice = cart.reduce((total, item) => total + item.precio * item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        loadSampleItems,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

