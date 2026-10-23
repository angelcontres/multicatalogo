// src/components/Catalogo.tsx
// Catálogo interactivo con búsqueda, filtros reactivos, ordenamiento y feedback visual
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/cart';
import { useToast } from '../context/toast';
import { getProductos } from '../services/productosService';
import { categorias, type Producto } from '../data/productos';
import { API_BASE_URL } from '../services/http';

const Catalogo = () => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);
  const [orden, setOrden] = useState<string>("recomendado");
  const [agregados, setAgregados] = useState<Record<number, boolean>>({});

  // Lectura del query string (?categoria=...)
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Filtrado y ordenamiento eficiente con useMemo
  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const filtrados = productos.filter((prod) => {
      const coincideCategoria = categoria === "Todas" || prod.categoria === categoria;
      const coincideTexto =
        texto === "" ||
        prod.nombre.toLowerCase().includes(texto) ||
        prod.descripcion.toLowerCase().includes(texto);
      return coincideCategoria && coincideTexto;
    });

    if (orden === "precio-asc") {
      return [...filtrados].sort((a, b) => a.precio - b.precio);
    } else if (orden === "precio-desc") {
      return [...filtrados].sort((a, b) => b.precio - a.precio);
    } else if (orden === "nombre-asc") {
      return [...filtrados].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    return filtrados;
  }, [productos, busqueda, categoria, orden]);

  const handleCategoriaChange = (value: string) => {
    setCategoria(value);
    if (value === "Todas") {
      setSearchParams({});
    } else {
      setSearchParams({ categoria: value });
    }
  };

  const handleAddToCart = (prod: Producto) => {
    addToCart(prod);
    setAgregados((prev) => ({ ...prev, [prod.id]: true }));
    showToast({
      title: "¡Producto Agregado!",
      message: `${prod.nombre} añadido a tu carrito`,
      type: "success",
      actionText: "Ver Carrito",
      onAction: () => navigate("/carrito"),
    });

    setTimeout(() => {
      setAgregados((prev) => ({ ...prev, [prod.id]: false }));
    }, 1500);
  };

  return (
    <div>
      {/* ===== HEADER CON KPI DE REDIS ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Productos</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? "Consultando catálogo..." : `${productosFiltrados.length} cosmético(s) disponible(s)`}
          </p>
        </div>
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
            {cacheStatus === "HIT" ? "(RAM < 5ms)" : "(PostgreSQL Query)"}
          </span>
        )}
      </div>

      {/* ===== BARRA DE BÚSQUEDA Y ORDENAMIENTO ===== */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-3.5 text-slate-400">🔍</span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, extracto, ingrediente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-sm transition bg-white"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 px-1 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition cursor-pointer"
        >
          <option value="recomendado">Ordenar por: Recomendados</option>
          <option value="precio-asc">Precio: Menor a Mayor</option>
          <option value="precio-desc">Precio: Mayor a Menor</option>
          <option value="nombre-asc">Nombre: A - Z</option>
        </select>
      </div>

      {/* ===== CHIPS HORIZONTALES DE CATEGORÍAS ===== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <button
          type="button"
          onClick={() => handleCategoriaChange("Todas")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            categoria === "Todas"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Todas ({productos.length})
        </button>
        {categorias.map((cat) => {
          const count = productos.filter((p) => p.categoria === cat).length;
          const isActive = categoria === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoriaChange(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat} {count > 0 && <span className={isActive ? "text-indigo-200" : "text-slate-400"}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* ===== SKELETON LOADERS (PULSE) O PRODUCTOS ===== */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse shadow-xs">
              <div className="w-full h-44 bg-slate-200 rounded-xl mb-4" />
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
              <div className="h-10 bg-slate-200 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-8 shadow-xs">
          <span className="text-4xl">🔎</span>
          <h3 className="font-bold text-slate-800 text-lg mt-3">Sin resultados</h3>
          <p className="text-slate-500 text-sm mt-1">
            No encontramos ningún cosmético que coincida con tus filtros actuales.
          </p>
          <button
            onClick={() => {
              setBusqueda("");
              handleCategoriaChange("Todas");
              setOrden("recomendado");
            }}
            className="mt-5 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productosFiltrados.map((prod) => {
            const isAdded = !!agregados[prod.id];
            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <Link to={`/producto/${prod.id}`} className="relative overflow-hidden block">
                  <img
                    src={prod.img}
                    alt={prod.nombre}
                    loading="lazy"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-indigo-700 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    {prod.categoria}
                  </span>
                </Link>

                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <Link to={`/producto/${prod.id}`}>
                      <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition text-base leading-snug">
                        {prod.nombre}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {prod.descripcion}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Precio</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        ${prod.precio.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(prod)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                        isAdded
                          ? "bg-emerald-600 text-white scale-95"
                          : "bg-slate-900 hover:bg-indigo-600 text-white shadow-xs active:scale-95"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <span>✓</span>
                          <span>¡Listo!</span>
                        </>
                      ) : (
                        <>
                          <span>+</span>
                          <span>Agregar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Catalogo;
