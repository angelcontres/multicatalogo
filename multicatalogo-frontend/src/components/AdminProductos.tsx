// src/components/AdminProductos.tsx
// Panel de administración de catálogo: CRUD de productos e inventario
import { useState, useEffect, type FormEvent } from "react";
import { API_BASE_URL } from "../services/http";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  img: string;
  activo: boolean;
}

export const AdminProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProd, setEditingProd] = useState<Producto | null>(null);

  // Formulario
  const [nombre, setNombre] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [precio, setPrecio] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("Serum");
  const [img, setImg] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/productos`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setProductos(Array.isArray(data) ? data : []);
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

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setStock("");
    setCategoria("Serum");
    setImg("");
    setEditingProd(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (p: Producto) => {
    setEditingProd(p);
    setNombre(p.nombre);
    setDescripcion(p.descripcion);
    setPrecio(p.precio.toString());
    setStock(p.stock.toString());
    setCategoria(p.categoria);
    setImg(p.img);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const token = localStorage.getItem("multicatalogo_jwt");
    const payload = {
      nombre,
      descripcion,
      precio: parseFloat(precio),
      stock: parseInt(stock, 10),
      categoria,
      img: img || undefined,
    };

    try {
      if (editingProd) {
        // Actualizar
        const res = await fetch(`${API_BASE_URL}/productos/${editingProd.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al actualizar producto");
      } else {
        // Crear
        const res = await fetch(`${API_BASE_URL}/productos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al crear producto");
      }

      setShowModal(false);
      resetForm();
      setReloadKey((prev) => prev + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al guardar el producto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActivo = async (id: number) => {
    if (!confirm("¿Seguro que deseas desactivar este producto del catálogo público?")) return;
    const token = localStorage.getItem("multicatalogo_jwt");

    try {
      const res = await fetch(`${API_BASE_URL}/productos/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        setReloadKey((prev) => prev + 1);
      }
    } catch {
      alert("Error al desactivar");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administración de Catálogo</h1>
          <p className="text-slate-500 text-sm mt-1">
            Crea productos, ajusta precios e inventario en tiempo real con sincronización de caché Redis
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition cursor-pointer"
        >
          <span>➕ Nuevo Producto</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <p>Cargando catálogo...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.img}
                          alt={p.nombre}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{p.nombre}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{p.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {p.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${p.precio.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          p.stock <= 5 ? "text-amber-600" : "text-slate-700"
                        }`}
                      >
                        {p.stock} unid.
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          p.activo
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-md transition cursor-pointer"
                      >
                        Editar
                      </button>
                      {p.activo && (
                        <button
                          onClick={() => handleToggleActivo(p.id)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-md transition cursor-pointer"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Crear / Editar Producto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingProd ? "Editar Producto" : "Nuevo Producto en Catálogo"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                >
                  <option value="Serum">Serum</option>
                  <option value="Crema">Crema</option>
                  <option value="Tónico">Tónico</option>
                  <option value="Mascarilla">Mascarilla</option>
                  <option value="Kit">Kit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Guardando..." : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductos;
