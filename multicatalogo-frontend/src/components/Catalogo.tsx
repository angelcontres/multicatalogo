// src/components/Catalogo.tsx
// Catálogo interactivo con búsqueda y filtros (Tema 5):
// - useMemo para filtrar la lista sin recalcular en cada render
// - Estado de carga y estado vacío
// - Tarjetas enlazadas al detalle /producto/:id
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/cart';
import { getProductos } from '../services/productosService';
import { categorias, type Producto } from '../data/productos';
import { API_BASE_URL } from '../services/http';

const Catalogo = () => {
  const { addToCart } = useCart();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);

  // Lectura del query string (?categoria=...) enviado desde el Storefront
  const [searchParams, setSearchParams] = useSearchParams();

  // Estado de los filtros
  const [busqueda, setBusqueda] = useState<string>("");
  const [categoria, setCategoria] = useState<string>(searchParams.get("categoria") ?? "Todas");

  useEffect(() => {
    let ignore = false;
    const fetchWithCacheHeader = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/productos`, {
          headers: { Accept: "application/json" },
        });
        const cacheHeader = res.headers.get("X-Cache");
        if (cacheHeader && !ignore) {
          setCacheStatus(cacheHeader);
        }
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && !ignore) {
            setProductos(data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback elegante
      }
      const fallback = await getProductos();
      if (!ignore) {
        setProductos(fallback);
        setLoading(false);
      }
    };

    fetchWithCacheHeader();
    return () => {
      ignore = true;
    };
  }, []);

  // Filtrado con useMemo
  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((prod) => {
      const coincideCategoria = categoria === "Todas" || prod.categoria === categoria;
      const coincideTexto =
        texto === "" ||
        prod.nombre.toLowerCase().includes(texto) ||
        prod.descripcion.toLowerCase().includes(texto);
      return coincideCategoria && coincideTexto;
    });
  }, [productos, busqueda, categoria]);

  const handleCategoriaChange = (value: string) => {
    setCategoria(value);
    if (value === "Todas") {
      setSearchParams({});
    } else {
      setSearchParams({ categoria: value });
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-500">Cargando catálogo...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-bold text-slate-800">Catálogo de Productos</h1>
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
            {cacheStatus === "HIT" ? "(RAM < 5ms)" : "(Query PostgreSQL)"}
          </span>
        )}
      </div>
      <p className="text-slate-500 mb-6">
        {productosFiltrados.length} producto(s) encontrado(s)
      </p>

      {/* ===== BARRA DE BÚSQUEDA Y FILTROS ===== */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o descripción..."
          className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
        />
        <select
          value={categoria}
          onChange={(e) => handleCategoriaChange(e.target.value)}
          className="px-4 py-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
        >
          <option value="Todas">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* ===== GRILLA DE PRODUCTOS ===== */}
      {productosFiltrados.length === 0 ? (
        <div className="bg-white p-10 rounded-lg border border-slate-200 text-center">
          <p className="text-slate-500">
            No hay productos que coincidan con tu búsqueda.
          </p>
          <button
            onClick={() => {
              setBusqueda("");
              setCategoria("Todas");
              setSearchParams({});
            }}
            className="mt-4 text-indigo-600 font-semibold hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productosFiltrados.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition"
            >
              <Link to={`/producto/${prod.id}`}>
                <img
                  src={prod.img}
                  alt={prod.nombre}
                  className="w-full h-44 object-cover hover:opacity-90 transition"
                />
              </Link>
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs uppercase tracking-wide text-indigo-500 font-semibold">
                  {prod.categoria}
                </p>
                <Link to={`/producto/${prod.id}`}>
                  <h3 className="font-semibold text-slate-700 hover:text-indigo-600 transition mt-1">
                    {prod.nombre}
                  </h3>
                </Link>
                <p className="text-indigo-600 font-bold mt-2 mb-4">
                  ${prod.precio.toFixed(2)}
                </p>

                <button
                  onClick={() => addToCart(prod)}
                  className="mt-auto w-full bg-slate-900 text-white py-2.5 rounded text-sm font-semibold hover:bg-indigo-600 transition active:scale-[0.98]"
                >
                  Añadir al Carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Catalogo;
