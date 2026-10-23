// src/components/MiRed.tsx
// Red multinivel visual (Tema 5):
// - Resumen: referidos activos, ventas de la red, comisiones del mes y nivel alcanzado
// - Árbol jerárquico recursivo de referidos con comisión calculada por nivel
import { useEffect, useState } from 'react';
import { redInicial, contarRed, sumarVentasRed, sumarComisiones, nivelAlcanzado, comisionDeReferido, TASA_COMISION, type Referido } from '../data/red';
import { getRed } from '../services/redService';
import { API_BASE_URL } from '../services/http';

interface ComisionLedger {
  id: number;
  pedido_id: number;
  nivel: number;
  porcentaje: number;
  monto: number;
  estado: string;
}

const NIVEL_ESTILO: Record<number, { badge: string; border: string; tasa: string }> = {
  1: { badge: "bg-indigo-100 text-indigo-700", border: "border-indigo-200", tasa: "10 %" },
  2: { badge: "bg-purple-100 text-purple-700", border: "border-purple-200", tasa: "5 %" },
  3: { badge: "bg-pink-100 text-pink-700", border: "border-pink-200", tasa: "2 %" },
};

const NodoReferido = ({ nodo }: { nodo: Referido }) => {
  const estilo = NIVEL_ESTILO[nodo.nivel] ?? NIVEL_ESTILO[1];
  const comision = comisionDeReferido(nodo);

  return (
    <li>
      <div className={`bg-white rounded-lg border ${estilo.border} shadow-sm p-4 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
            {nodo.nombre.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{nodo.nombre}</p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${estilo.badge}`}>
              Nivel {nodo.nivel} · {estilo.tasa} comisión
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Ventas</p>
          <p className="font-bold text-slate-800">${nodo.ventas.toLocaleString()}</p>
          <p className="text-xs text-indigo-600 font-semibold mt-1">
            +${comision.toFixed(2)} para ti
          </p>
        </div>
      </div>

      {nodo.hijos && nodo.hijos.length > 0 && (
        <ul className="mt-3 ml-6 space-y-3 border-l-2 border-slate-200 pl-4">
          {nodo.hijos.map((hijo) => (
            <NodoReferido key={hijo.id} nodo={hijo} />
          ))}
        </ul>
      )}
    </li>
  );
};

const MiRed = () => {
  const [red, setRed] = useState<Referido>(redInicial);
  const [comisionesLedger, setComisionesLedger] = useState<ComisionLedger[]>([]);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchRed = async () => {
      try {
        const token = localStorage.getItem("multicatalogo_jwt");
        const res = await fetch(`${API_BASE_URL}/red`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const header = res.headers.get("X-Cache");
        if (header && !ignore) {
          setCacheStatus(header);
        }
        if (res.ok) {
          const data = await res.json();
          if (data && data.nombre && !ignore) {
            setRed(data);
            return;
          }
        }
      } catch {
        // Fallback
      }
      const fallback = await getRed();
      if (!ignore && fallback) {
        setRed(fallback);
      }
    };

    fetchRed();

    const fetchComisiones = async () => {
      try {
        const token = localStorage.getItem("multicatalogo_jwt");
        const res = await fetch(`${API_BASE_URL}/comisiones/mias`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setComisionesLedger(data.comisiones || []);
          }
        }
      } catch {
        // Fallback
      }
    };

    fetchComisiones();

    return () => {
      ignore = true;
    };
  }, []);

  const handleCopiarEnlace = () => {
    const enlace = `${window.location.origin}/registro?ref=${red.codigo || "TU"}`;
    navigator.clipboard.writeText(enlace);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const referidosActivos = contarRed(red);
  const ventasRed = sumarVentasRed(red);
  const comisionesMes = sumarComisiones(red);
  const nivel = nivelAlcanzado(red.hijos?.length ?? 0);

  const resumen = [
    { etiqueta: "Referidos Activos", valor: referidosActivos.toString(), color: "text-indigo-600" },
    { etiqueta: "Ventas de la Red", valor: `$${ventasRed.toLocaleString()}`, color: "text-indigo-600" },
    { etiqueta: "Comisiones del Mes", valor: `$${comisionesMes.toFixed(2)}`, color: "text-green-600" },
    { etiqueta: "Nivel Alcanzado", valor: nivel, color: "text-amber-600" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-bold text-slate-800">Mi Red de Referidos</h1>
        {cacheStatus && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              cacheStatus === "HIT"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                cacheStatus === "HIT" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            ></span>
            Redis: {cacheStatus}{" "}
            {cacheStatus === "HIT" ? "(RAM < 5ms)" : "(Cálculo DB Recursivo)"}
          </span>
        )}
      </div>
      <p className="text-slate-500 mb-6">
        Estructura multinivel: gana el {TASA_COMISION[1] * 100} % de nivel 1, {TASA_COMISION[2] * 100} % de nivel 2 y {TASA_COMISION[3] * 100} % de nivel 3.
      </p>

      {/* ===== ENLACE DE INVITACIÓN DE REFERIDO ===== */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md mb-8 border border-indigo-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              🚀 Expande tu Red Multinivel
            </span>
            <h3 className="text-lg font-bold text-white mt-1">Tu Enlace de Afiliación Personal</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Comparte este enlace para registrar nuevos distribuidores bajo tu árbol y ganar comisiones del 10% (nivel 1), 5% (nivel 2) y 2% (nivel 3).
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 shrink-0">
            <span className="font-mono text-xs text-indigo-300 px-3 select-all">
              {`${window.location.origin}/registro?ref=${red.codigo || "TU"}`}
            </span>
            <button
              onClick={handleCopiarEnlace}
              type="button"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow cursor-pointer shrink-0"
            >
              {copiado ? "¡Copiado! ✓" : "Copiar Enlace"}
            </button>
          </div>
        </div>
      </div>

      {/* ===== TARJETAS DE RESUMEN ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {resumen.map((item) => (
          <div key={item.etiqueta} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 uppercase font-semibold">{item.etiqueta}</p>
            <p className={`text-3xl font-bold mt-2 ${item.color}`}>{item.valor}</p>
          </div>
        ))}
      </div>

      {/* ===== ÁRBOL DE REFERIDOS ===== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Jerarquía de tu Red</h2>

        {/* Raíz: el usuario */}
        <div className="bg-slate-900 text-white rounded-lg p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
              {red.nombre.charAt(0)}
            </div>
            <div>
              <p className="font-semibold">{red.nombre}</p>
              <p className="text-xs text-slate-300">Nivel alcanzado: {nivel}</p>
            </div>
          </div>
          <p className="font-bold text-green-400">
            Comisiones del mes: ${comisionesMes.toFixed(2)}
          </p>
        </div>

        <ul className="space-y-3">
          {red.hijos?.map((hijo) => (
            <NodoReferido key={hijo.id} nodo={hijo} />
          ))}
        </ul>
      </div>

      {/* ===== LEDGER DE COMISIONES AUDITABLE ===== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Ledger de Comisiones Devengadas</h2>
            <p className="text-slate-500 text-xs">Historial inmutable de ingresos generados por ventas de tu red</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-md">
            {comisionesLedger.length} transacciones
          </span>
        </div>

        {comisionesLedger.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No hay comisiones registradas en el ledger aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Pedido Origen</th>
                  <th className="px-4 py-3">Nivel MLM</th>
                  <th className="px-4 py-3">Porcentaje</th>
                  <th className="px-4 py-3">Monto Ganado</th>
                  <th className="px-4 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comisionesLedger.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                      MC-{c.pedido_id}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      Nivel {c.nivel}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {(c.porcentaje * 100).toFixed(0)} %
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600">
                      +${c.monto.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          c.estado === "pagada"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.estado === "revertida"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {c.estado}
                      </span>
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

export default MiRed;
