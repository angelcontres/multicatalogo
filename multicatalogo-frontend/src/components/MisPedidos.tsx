// src/components/MisPedidos.tsx
// Historial de pedidos realizados por el usuario autenticado
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../services/http";

interface ItemPedido {
  producto_id: number;
  cantidad: number;
  precio_unitario?: number;
}

interface Pedido {
  id: number;
  cliente_email: string;
  total: number;
  estado: string;
  items?: ItemPedido[];
}

const estadoBadges: Record<string, { label: string; class: string }> = {
  pendiente: { label: "Pendiente", class: "bg-amber-100 text-amber-800 border-amber-200" },
  preparando: { label: "En Preparación", class: "bg-purple-100 text-purple-800 border-purple-200" },
  enviado: { label: "Enviado", class: "bg-blue-100 text-blue-800 border-blue-200" },
  entregado: { label: "Entregado", class: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelado: { label: "Cancelado", class: "bg-rose-100 text-rose-800 border-rose-200" },
};

export const MisPedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const token = localStorage.getItem("multicatalogo_jwt");
        const res = await fetch(`${API_BASE_URL}/pedidos/mios`, {
          headers: {
            "Accept": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error("No se pudo obtener el historial de pedidos");
        }

        const data = await res.json();
        setPedidos(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Pedidos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Consulta el estado de tus compras y comprobantes de pedido
          </p>
        </div>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
        >
          <span>🛍️ Explorar Catálogo</span>
        </Link>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
          <p>Cargando tus pedidos...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {!loading && pedidos.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            📦
          </div>
          <h3 className="text-lg font-bold text-slate-800">Aún no tienes pedidos registrados</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Tus compras confirmadas aparecerán aquí con seguimiento en tiempo real y cálculo de comisiones.
          </p>
          <Link
            to="/catalogo"
            className="mt-6 inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow transition"
          >
            Comprar Ahora
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {pedidos.map((p) => {
          const badge = estadoBadges[p.estado] || {
            label: p.estado,
            class: "bg-slate-100 text-slate-800 border-slate-200",
          };

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm">
                    MC-{p.id}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.class}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total del Pedido</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    ${p.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {p.items && p.items.length > 0 && (
                <div className="pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Artículos en este pedido ({p.items.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {p.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs flex justify-between items-center"
                      >
                        <span className="text-slate-700 font-medium">
                          Producto #{it.producto_id}
                        </span>
                        <span className="text-indigo-600 font-bold">
                          Cant: {it.cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MisPedidos;
