// src/components/AdminPedidos.tsx
// Consola administrativa para control del ciclo de vida y cancelación de órdenes
import { useState, useEffect } from "react";
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

const ESTADOS_DISPONIBLES = ["pendiente", "preparando", "enviado", "entregado", "cancelado"];

export const AdminPedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<string>("todos");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const token = localStorage.getItem("multicatalogo_jwt");
        const url = filtro === "todos" 
          ? `${API_BASE_URL}/pedidos` 
          : `${API_BASE_URL}/pedidos?estado=${filtro}`;

        const res = await fetch(url, {
          headers: {
            "Accept": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error("No se pudo obtener el listado de pedidos");
        }

        const data = await res.json();
        if (!ignore) {
          setPedidos(Array.isArray(data) ? data : []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error) setError(err.message);
          else setError("Error al cargar pedidos");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [filtro]);

  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem("multicatalogo_jwt");
      const res = await fetch(`${API_BASE_URL}/pedidos/${id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al actualizar el estado");
      }

      // Actualizar estado localmente
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al procesar la actualización");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control y Gestión de Pedidos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Administra estados de entrega, cancelaciones y devoluciones automáticas de stock
          </p>
        </div>

        {/* Filtros de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["todos", ...ESTADOS_DISPONIBLES].map((st) => (
            <button
              key={st}
              onClick={() => setFiltro(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filtro === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
          <p>Cargando pedidos de la plataforma...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-500">No se encontraron pedidos con el filtro actual ({filtro}).</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Orden</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Ítems</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción de Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                      MC-{p.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {p.cliente_email}
                    </td>
                    <td className="px-6 py-4">
                      {p.items ? p.items.length : 1} producto(s)
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${p.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.estado === "entregado"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.estado === "cancelado"
                            ? "bg-rose-100 text-rose-800"
                            : p.estado === "enviado"
                            ? "bg-blue-100 text-blue-800"
                            : p.estado === "preparando"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        disabled={updatingId === p.id}
                        value={p.estado}
                        onChange={(e) => handleCambiarEstado(p.id, e.target.value)}
                        className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-600 outline-none cursor-pointer disabled:opacity-50"
                      >
                        {ESTADOS_DISPONIBLES.map((st) => (
                          <option key={st} value={st}>
                            {st === "cancelado" ? "❌ Cancelar (Devolver Stock)" : `Cambiar a: ${st}`}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPedidos;
