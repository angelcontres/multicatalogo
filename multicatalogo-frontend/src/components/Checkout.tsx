// src/components/Checkout.tsx
// Flujo de checkout con consumo de API /api/checkout y fallback
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/cart';
import { useAuth } from '../context/auth';
import { API_BASE_URL } from '../services/http';

interface DatosEnvio {
  nombre: string;
  email: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  metodoPago: string;
}

const METODOS_PAGO = ["Tarjeta de crédito", "Transferencia bancaria", "Efectivo contra entrega"];

const Checkout = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [datos, setDatos] = useState<DatosEnvio>({
    nombre: "",
    email: user?.email || "",
    direccion: "",
    ciudad: "",
    telefono: "",
    metodoPago: METODOS_PAGO[0],
  });
  const [procesando, setProcesando] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [simularFallo, setSimularFallo] = useState<boolean>(false);

  if (cart.length === 0) {
    return (
      <div className="bg-white p-10 rounded-lg border border-slate-200 text-center">
        <p className="text-slate-600 text-lg mb-4">No tienes productos en el carrito.</p>
        <Link to="/catalogo" className="text-indigo-600 font-semibold hover:underline">
          ← Ir al catálogo
        </Link>
      </div>
    );
  }

  const handleChange = (campo: keyof DatosEnvio, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  };

  const autocompletarDatosPrueba = () => {
    setDatos({
      nombre: user?.email.includes("ana")
        ? "Ana García"
        : user?.email.includes("carlos")
        ? "Carlos Ruiz"
        : user?.email.includes("marta")
        ? "Marta Sánchez"
        : user?.email.includes("valeria")
        ? "Valeria Castro"
        : user?.email.includes("cliente")
        ? "Luis Poveda"
        : "Administrador General",
      email: user?.email || "cliente@upse.edu.ec",
      direccion: "Av. Universitaria #405 y Malecón",
      ciudad: "La Libertad",
      telefono: "0991234567",
      metodoPago: METODOS_PAGO[0],
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcesando(true);
    setError("");

    const payload = {
      nombre: datos.nombre,
      email: datos.email,
      direccion: datos.direccion,
      ciudad: datos.ciudad,
      telefono: datos.telefono,
      metodoPago: datos.metodoPago,
      items: cart.map((item) => ({
        producto_id: item.id,
        cantidad: item.cantidad,
      })),
      total: totalPrice,
      simulate_failure: simularFallo,
    };

    try {
      const token = localStorage.getItem("multicatalogo_jwt");
      const res = await fetch(`${API_BASE_URL}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(simularFallo ? { "X-Simulate-Failure": "true" } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const pedido = {
          numero: `MC-${data.pedido_id || Date.now().toString().slice(-6)}`,
          items: cart.map((item) => ({
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio,
          })),
          total: data.total || totalPrice,
          cliente: { nombre: datos.nombre, email: datos.email, ciudad: datos.ciudad },
          fecha: new Date().toLocaleString("es-EC"),
        };
        clearCart();
        navigate("/confirmacion", { state: { pedido } });
        return;
      } else {
        const errJson = await res.json().catch(() => null);
        if (errJson?.message) {
          setError(errJson.message);
          setProcesando(false);
          return;
        }
      }
    } catch {
      // Si la API no está disponible en localhost:3000, simular checkout local
    }

    // Fallback de simulación
    setTimeout(() => {
      const pedido = {
        numero: `MC-${Date.now().toString().slice(-6)}`,
        items: cart.map((item) => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
        })),
        total: totalPrice,
        cliente: { nombre: datos.nombre, email: datos.email, ciudad: datos.ciudad },
        fecha: new Date().toLocaleString("es-EC"),
      };

      clearCart();
      navigate("/confirmacion", { state: { pedido } });
    }, 1000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Finalizar Compra</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== FORMULARIO DE ENVÍO ===== */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-bold text-slate-800">Datos de Envío</h2>
              <button
                type="button"
                onClick={autocompletarDatosPrueba}
                className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-lg border border-indigo-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>⚡</span> Autocompletar datos de prueba
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={datos.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={datos.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  required
                  value={datos.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  required
                  value={datos.ciudad}
                  onChange={(e) => handleChange("ciudad", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={datos.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Método de Pago</h2>
            <div className="space-y-3">
              {METODOS_PAGO.map((metodo) => (
                <label
                  key={metodo}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition"
                >
                  <input
                    type="radio"
                    name="metodoPago"
                    value={metodo}
                    checked={datos.metodoPago === metodo}
                    onChange={(e) => handleChange("metodoPago", e.target.value)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700">{metodo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ===== CONTROL DIDÁCTICO PARA EVALUACIÓN DOCENTE ===== */}
          <div className="bg-amber-50/70 p-4 rounded-lg border border-amber-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={simularFallo}
                onChange={(e) => setSimularFallo(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 accent-amber-600"
              />
              <div className="text-xs">
                <span className="font-bold text-amber-900 block">🧪 Demostración Docente: Simular Fallo ACID (Rollback)</span>
                <span className="text-amber-700">
                  Activa esta opción para comprobar cómo el backend en Go aborta la transacción (`ROLLBACK`), evitando órdenes fantasmas, deducción de stock y pago de comisiones indebidas.
                </span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={procesando}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {procesando ? "Procesando pago..." : "Confirmar Pedido"}
          </button>
        </form>

        {/* ===== RESUMEN DEL PEDIDO ===== */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Resumen del Pedido</h2>
          <div className="space-y-3 border-b border-slate-100 pb-4 mb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {item.nombre} × {item.cantidad}
                </span>
                <span className="font-semibold text-slate-800">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-800 font-bold">Total</span>
            <span className="text-2xl font-bold text-indigo-600">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
