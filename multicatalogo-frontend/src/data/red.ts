// src/data/red.ts
// Datos de ejemplo (mock) de la red multinivel de referidos.
// Incluye la estructura jerárquica (árbol) y funciones puras para calcular
// comisiones, totales y el nivel alcanzado por el usuario.

export interface Referido {
  id: number;
  nombre: string;
  codigo?: string;   // Código único para invitaciones MLM
  nivel: number;     // 1 = directo, 2 = indirecto, 3 = tercer nivel
  ventas: number;    // ventas mensuales en dólares
  hijos?: Referido[]; // referidos de un nivel más abajo
}

// Porcentaje de comisión que recibe el usuario por las ventas de cada nivel
export const TASA_COMISION: Record<number, number> = {
  1: 0.10, // 10 % de las ventas de nivel 1
  2: 0.05, // 5 % de las ventas de nivel 2
  3: 0.02, // 2 % de las ventas de nivel 3
};

// Raíz del árbol: el usuario autenticado (nivel 0) con sus referidos
export const redInicial: Referido = {
  id: 0,
  nombre: "Tú",
  codigo: "TU",
  nivel: 0,
  ventas: 3850,
  hijos: [
    {
      id: 1,
      nombre: "Ana García",
      codigo: "ANA",
      nivel: 1,
      ventas: 1850,
      hijos: [
        {
          id: 4,
          nombre: "Carlos Ruiz",
          codigo: "CARLOS",
          nivel: 2,
          ventas: 620,
          hijos: [
            { id: 7, nombre: "Diana Paz", codigo: "DIANA", nivel: 3, ventas: 350 },
            { id: 13, nombre: "Felipe Silva", codigo: "FELIPE", nivel: 3, ventas: 280 },
          ],
        },
        { id: 5, nombre: "Sofía León", codigo: "SOFIA", nivel: 2, ventas: 540 },
      ],
    },
    {
      id: 2,
      nombre: "Luis Poveda",
      codigo: "LUIS",
      nivel: 1,
      ventas: 1420,
      hijos: [
        {
          id: 6,
          nombre: "Marco Díaz",
          codigo: "MARCO",
          nivel: 2,
          ventas: 480,
          hijos: [
            { id: 14, nombre: "Gabriel Morales", codigo: "GABRIEL", nivel: 3, ventas: 310 },
          ],
        },
        { id: 10, nombre: "Javier Ortiz", codigo: "JAVIER", nivel: 2, ventas: 390 },
      ],
    },
    {
      id: 3,
      nombre: "Marta Sánchez",
      codigo: "MARTA",
      nivel: 1,
      ventas: 980,
      hijos: [
        {
          id: 11,
          nombre: "Andrea Mora",
          codigo: "ANDREA",
          nivel: 2,
          ventas: 510,
          hijos: [
            { id: 15, nombre: "Natalia Vega", codigo: "NATALIA", nivel: 3, ventas: 410 },
          ],
        },
      ],
    },
    {
      id: 8,
      nombre: "Carlos Mendoza",
      codigo: "CARLOSM",
      nivel: 1,
      ventas: 750,
    },
    {
      id: 9,
      nombre: "Valeria Castro",
      codigo: "VALERIA",
      nivel: 1,
      ventas: 1100,
      hijos: [
        {
          id: 12,
          nombre: "Diego Torres",
          codigo: "DIEGO",
          nivel: 2,
          ventas: 420,
          hijos: [
            { id: 16, nombre: "Camila Rivas", codigo: "CAMILA", nivel: 3, ventas: 260 },
          ],
        },
      ],
    },
  ],
};

// Total de referidos de la red (sin contar al usuario raíz)
export const contarRed = (raiz: Referido): number => {
  const directos = raiz.hijos ?? [];
  return directos.reduce((total, hijo) => total + 1 + contarRed(hijo), 0);
};

// Suma de ventas de toda la red (excluye las ventas propias del usuario raíz)
export const sumarVentasRed = (raiz: Referido): number => {
  const directos = raiz.hijos ?? [];
  return directos.reduce((total, hijo) => total + hijo.ventas + sumarVentasRed(hijo), 0);
};

// Comisión que recibe el usuario por las ventas de cada referido (ventas * tasa del nivel)
export const comisionDeReferido = (ref: Referido): number =>
  ref.ventas * (TASA_COMISION[ref.nivel] ?? 0);

// Comisiones totales del mes acumuladas sobre toda la red
export const sumarComisiones = (raiz: Referido): number => {
  const directos = raiz.hijos ?? [];
  return directos.reduce(
    (total, hijo) => total + comisionDeReferido(hijo) + sumarComisiones(hijo),
    0
  );
};

// Nivel alcanzado por el usuario según la cantidad de referidos directos
export const nivelAlcanzado = (referidosDirectos: number): string => {
  if (referidosDirectos >= 6) return "Diamante";
  if (referidosDirectos >= 4) return "Oro";
  if (referidosDirectos >= 2) return "Plata";
  return "Bronce";
};
