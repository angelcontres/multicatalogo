// src/App.tsx
import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Catalogo from './components/Catalogo';
import Storefront from './components/Storefront';
import DetalleProducto from './components/DetalleProducto';
import MiRed from './components/MiRed';
import Carrito from './components/Carrito';
import Checkout from './components/Checkout';
import Confirmacion from './components/Confirmacion';
import Login from './components/Login';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth';

// Guarda para rutas privadas que requieren autenticación
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Guarda para rutas exclusivas del administrador
const AdminRoute = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.rol !== 'admin') {
    return <Navigate to="/tienda" replace />;
  }

  return <Outlet />;
};

// Proveedor intermedio del carrito que se remonta al cambiar de usuario
const CartBoundary = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  return (
    <CartProvider key={user?.email ?? "anonimo"}>
      {children}
    </CartProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartBoundary>
        <BrowserRouter>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />

            {/* Rutas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                {/* Exclusivo para Admin */}
                <Route element={<AdminRoute />}>
                  <Route index element={<Dashboard />} />
                  <Route path="mi-red" element={<MiRed />} />
                </Route>

                {/* Ambos roles (Admin y Cliente) */}
                <Route path="tienda" element={<Storefront />} />
                <Route path="catalogo" element={<Catalogo />} />
                <Route path="producto/:id" element={<DetalleProducto />} />
                <Route path="carrito" element={<Carrito />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="confirmacion" element={<Confirmacion />} />
              </Route>
            </Route>

            {/* Ruta comodín */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartBoundary>
    </AuthProvider>
  );
}

export default App;
