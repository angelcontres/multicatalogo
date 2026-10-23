// src/components/AdminLiquidaciones.tsx
// Módulo de liquidación y pago de comisiones a distribuidores MLM
import { useState, useEffect, type FormEvent } from "react";
import { API_BASE_URL } from "../services/http";

interface Liquidacion {
  id: number;
  referido_id: number;
  total: number;
  estado: string;
  creado_en: string;
  pagada_en: string;
}

export const AdminLiquidaciones = () => {
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [referidoId, setReferidoId] = useState<string>("2");
  const [procesando, setProcesando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>("");
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const token = localStorage.getItem("multicatalogo_jwt");
        const res = await fetch(`${API_BASE_URL}/liquidaciones`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok && !ignore) {
          const data = await res.json();
          setLiquidaciones(Array.isArray(data) ? data : []);
        }
      } catch {
        // Ignorar
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
  }, [reloadKey]);

  const handleLiquidar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcesando(true);
    setMensaje("");

    const token = localStorage.getItem("multicatalogo_jwt");
    try {
      const res = await fetch(`${API_BASE_URL}/liquidaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ referido_id: parseInt(referidoId, 10) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "No se pudo procesar la liquidación");
      }

      setMensaje(`✅ Liquidación #${data.id} procesada exitosamente por un total de $${data.total.toFixed(2)}.`);
      setReloadKey((prev) => prev + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al liquidar");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-800">Liquidaciones a Distribuidores</h1>
        <p className="text-slate-500 text-sm mt-1">
          Cierra el ciclo financiero del MLM consolidando comisiones devengadas en pagos liquidados
        </p>
      </div>

      {mensaje && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
          {mensaje}
        </div>
      )}

      {/* Formulario de Pago */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-3">
          Emitir Nueva Liquidación
        </h3>
        <form onSubmit={handleLiquidar} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Seleccionar Distribuidor
            </label>
            <select
              value={referidoId}
              onChange={(e) => setReferidoId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
            >
              <option value="2">Luis Poveda (Nodo #2 - Nivel 1)</option>
              <option value="1">Ana García (Nodo #1 - Nivel 1)</option>
              <option value="0">Tú / Cuenta Raíz (Nodo #0)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={procesando}
            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-sm transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            {procesando ? "Liquidando..." : "💳 Liquidar Comisiones"}
          </button>
        </form>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Historial de Liquidaciones Pagadas</h3>
          <span className="text-xs text-slate-400 font-medium">
            Total emitidas: {liquidaciones.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando pagos...</div>
        ) : liquidaciones.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No se han emitido liquidaciones aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Liquidación ID</th>
                  <th className="px-6 py-4">Distribuidor</th>
                  <th className="px-6 py-4">Monto Pagado</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Fecha de Emisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liquidaciones.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                      LIQ-{l.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      Distribuidor #{l.referido_id}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900">
                      ${l.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {l.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-400">
                      {new Date(l.creado_en).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLiquidaciones;
