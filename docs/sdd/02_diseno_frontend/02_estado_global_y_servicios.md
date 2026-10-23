# SDD-02.2: DISEÑO FRONTEND — ESTADO GLOBAL Y SERVICIOS

## 1. Gestión de Estado Global (React Context API)

El frontend mantiene dos contextos globales desacoplados para evitar el re-renderizado innecesario de componentes ajenos:

### 1.1 Contexto de Autenticación (`AuthContext.tsx`)
Maneja la identidad, perfil y token del usuario actual.

```typescript
export interface UserSession {
  email: string;
  rol: 'admin' | 'cliente';
  token: string;
}

export interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (session: UserSession) => void;
  logout: () => void;
}
```

- **Persistencia:** Almacena la sesión en `localStorage` bajo la clave `multicatalogo_sesion`. Al recargar el navegador, inicializa el estado leyendo esta clave sin necesidad de re-autenticación.
- **Seguridad en Memoria:** Si el token JWT expira (HTTP 401 desde la API), el cliente HTTP invoca automáticamente `logout()` y limpia el almacenamiento.

### 1.2 Contexto del Carrito (`CartContext.tsx`)
Administra los artículos seleccionados, cantidades y cálculos de subtotal.

```typescript
export interface CartItem {
  producto: Producto;
  cantidad: number;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (producto: Producto, cantidad?: number) => void;
  removeFromCart: (productoId: number) => void;
  updateQuantity: (productoId: number, cantidad: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}
```

- **Aislamiento Multiusuario:** El carrito se guarda en `localStorage` con clave dinámica:
  ```typescript
  const storageKey = user ? `multicatalogo_carrito_${user.email}` : 'multicatalogo_carrito_anonimo';
  ```
  Esto previene que un usuario vea los artículos del carrito de otro usuario tras un cambio de sesión en la misma máquina.

---

## 2. Capa de Abstracción de Servicios HTTP (`services/http.ts`)

Todas las comunicaciones con la API pasan por un cliente unificado `apiFetch`:

```typescript
export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('multicatalogo_jwt');
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = { message: 'Error de servidor', details: null };
    try {
      errorData = await response.json();
    } catch (_) {}
    throw new ApiError(response.status, errorData.message || response.statusText, errorData.details);
  }

  return response.json() as Promise<T>;
}
```
