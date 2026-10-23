// src/components/Carrito.tsx
// Carrito de compras con controles de cantidad (Tema 5):
// - incrementQuantity / decrementQuantity desde el contexto
// - Enlace al flujo de checkout
import { Link } from 'react-router-dom';
import { useCart } from '../context/cart';

const Carrito = () => {
  const {
    cart,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    loadSampleItems,
    totalPrice,
  } = useCart();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tu Carrito de Compras</h1>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline"
          >
            Vaciar Carrito
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-xs text-center max-w-lg mx-auto my-8">
          <span className="text-5xl">🛍️</span>
          <h2 className="text-xl font-bold text-slate-800 mt-3">Tu carrito está vacío</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Añade cosméticos desde el catálogo o carga productos de prueba para simular el proceso de compra.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              type="button"
              onClick={loadSampleItems}
              className="bg-indigo-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-indigo-700 transition text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>⚡</span> Cargar Productos de Prueba
            </button>
            <Link
              to="/catalogo"
              className="bg-slate-100 text-slate-700 font-bold px-5 py-3 rounded-xl hover:bg-slate-200 transition text-xs text-center"
            >
              Explorar Catálogo Completo
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm gap-4 flex-wrap sm:flex-nowrap"
              >
                <div className="flex items-center gap-4 min-w-[200px]">
                  <img
                    src={item.img}
                    alt={item.nombre}
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                  />
                  <div>
                    <Link to={`/producto/${item.id}`}>
                      <h3 className="font-semibold text-slate-800 hover:text-indigo-600 transition">
                        {item.nombre}
                      </h3>
                    </Link>
                    <p className="text-sm text-slate-500">${item.precio.toFixed(2)} c/u</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                  {/* Control de cantidad */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => decrementQuantity(item.id)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 transition min-w-[36px] min-h-[36px] flex items-center justify-center font-bold"
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>
                    <span className="px-3 py-2 text-sm font-semibold text-slate-800 border-x border-slate-200 min-w-[32px] text-center">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => incrementQuantity(item.id)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 transition min-w-[36px] min-h-[36px] flex items-center justify-center font-bold"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>

                  <p className="font-bold text-indigo-600 w-20 text-right">
                    ${(item.precio * item.cantidad).toFixed(2)}
                  </p>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 transition p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Eliminar producto"
                    aria-label="Eliminar producto"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen de pago */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Resumen del Pedido</h2>
            <div className="flex justify-between border-b border-slate-100 pb-4 mb-4">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-800 font-bold">Total a Pagar</span>
              <span className="text-2xl font-bold text-indigo-600">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <Link
              to="/checkout"
              className="block w-full text-center bg-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:bg-indigo-700 transition min-h-[44px] flex items-center justify-center"
            >
              Proceder al Pago
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carrito;
