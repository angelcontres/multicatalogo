// src/services/redService.ts
import { redInicial, type Referido } from '../data/red';
import { apiFetch } from './http';

export const getRed = async (): Promise<Referido> => {
  try {
    const res = await apiFetch<Referido>('/red');
    if (res && res.nombre) {
      return res;
    }
  } catch {
    // Fallback elegante a datos estructurados locales
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(redInicial), 250);
  });
};
