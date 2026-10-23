// src/components/Navbar.tsx
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const { totalItems } = useCart();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 relative z-30">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-slate-100 transition text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          aria-label="Alternar menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-slate-600 font-medium text-base md:text-lg hidden sm:block">
          {user?.rol === "admin" ? "Panel de Administración" : "Tienda MultiCatálogo"}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {/* SHOPPING CART BADGE */}
        <Link
          to="/carrito"
          className="relative p-2 hover:bg-slate-100 rounded-full transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Ver carrito"
        >
          <span className="text-xl">🛒</span>
          {totalItems > 0 && (
            <span className="absolute top-1 right-1 bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
              {totalItems}
            </span>
          )}
        </Link>

        {/* USER PROFILE INFO & LOGOUT */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              {user?.email}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              Rol: {user?.rol}
            </span>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase hidden sm:inline-block ${
              user?.rol === "admin"
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-indigo-100 text-indigo-800 border border-indigo-200"
            }`}
          >
            {user?.rol}
          </span>

          <div className="relative group cursor-pointer pb-1">
            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden border border-slate-300 flex items-center justify-center">
              <img
                src="https://fastly.picsum.photos/id/64/4326/2884.jpg?hmac=9_SzX666YRpR_fOyYStXpfSiJ_edO3ghlSRnH2w09Kg"
                alt="Avatar del usuario"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-400 capitalize">Cuenta: {user?.rol}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-lg transition-colors cursor-pointer mt-1"
              >
                Cerrar Sesión ➔
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
