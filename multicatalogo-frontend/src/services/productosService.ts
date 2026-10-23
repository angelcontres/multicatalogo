// src/services/productosService.ts
// Capa de servicios del catálogo.
// Devuelve los productos consultados a la API si está disponible, o usa el mock como fallback.

import { productosMock, type Producto } from "../data/productos";

const API_BASE = "http://localhost:3000/api";

// Obtener catálogo completo
export const getProductos = async (): Promise<Producto[]> => {
  try {
    const res = await fetch(`${API_BASE}/productos`, {
      headers: { "Accept": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Fallback elegante a datos locales
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(productosMock), 300);
  });
};

// Obtener detalle de un producto por ID
export const getProductoById = async (id: number): Promise<Producto | undefined> => {
  try {
    const res = await fetch(`${API_BASE}/productos/${id}`, {
      headers: { "Accept": "application/json" }
    });
    if (res.ok) {
      const prod = await res.json();
      return prod;
    }
  } catch {
    // Fallback a mock
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(productosMock.find((p) => p.id === id)), 200);
  });
};
