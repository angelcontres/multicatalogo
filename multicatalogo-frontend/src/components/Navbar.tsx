// src/components/Navbar.tsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { useAuth, type Rol } from "../context/auth";
import { useToast } from "../context/toast";
import { API_BASE_URL } from "../services/http";

interface NavbarProps {
  toggleSidebar: () => void;
}

const DEMO_USERS = [
  { nombre: "Admin General", email: "admin@upse.edu.ec", rol: "admin" as Rol, badge: "👑 Admin General", ref: "TU" },
  { nombre: "Luis Poveda", email: "cliente@upse.edu.ec", rol: "cliente" as Rol, badge: "🛍️ Luis Poveda (Nivel 1)", ref: "LUIS" },
  { nombre: "Ana García", email: "ana@upse.edu.ec", rol: "cliente" as Rol, badge: "🌟 Ana García (Nivel 1)", ref: "ANA" },
  { nombre: "Marta Sánchez", email: "marta@upse.edu.ec", rol: "cliente" as Rol, badge: "💼 Marta Sánchez (Nivel 1)", ref: "MARTA" },
  { nombre: "Carlos Ruiz", email: "carlos@upse.edu.ec", rol: "cliente" as Rol, badge: "🚀 Carlos Ruiz (Nivel 2)", ref: "CARLOS" },
  { nombre: "Valeria Castro", email: "valeria@upse.edu.ec", rol: "cliente" as Rol, badge: "💎 Valeria Castro (Nivel 1)", ref: "VALERIA" },
];

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const { totalItems } = useCart();
  const { logout, login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [switcherAbierto, setSwitcherAbierto] = useState<boolean>(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSwitchAccount = async (targetEmail: string, rol: Rol, nombre: string) => {
    setSwitcherAbierto(false);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: "123456" }),
      });
      if (res.ok) {
        const data = await res.json();
        login({ email: data.email, rol: data.rol as Rol, token: data.token });
        showToast({
          title: "Cuenta Cambiada",
          message: `Sesión iniciada como ${nombre}`,
          type: "success",
        });
        return;
      }
    } catch {
      // Fallback
    }
    login({ email: targetEmail, rol });
    showToast({
      title: "Cuenta Cambiada",
      message: `Sesión iniciada como ${nombre}`,
      type: "info",
    });
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
        {/* FAST ACCOUNT SWITCHER / DEMO BUTTON */}
        <div className="relative" ref={switcherRef}>
          <button
            type="button"
            onClick={() => setSwitcherAbierto((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-700 text-xs font-bold transition shadow-xs cursor-pointer"
            title="Cambiar rápidamente de usuario para demostrar roles y árbol MLM"
          >
            <span>⚡</span>
            <span className="hidden md:inline">Probar Cuenta</span>
            <span className="text-indigo-400 text-[10px]">▾</span>
          </button>

          {switcherAbierto && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800">Selector Rápido de Cuentas</p>
                <p className="text-[10px] text-slate-500">Haz clic para alternar usuarios y ver cómo cambian sus árboles MLM y pedidos al instante</p>
              </div>
              <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                {DEMO_USERS.map((acc) => {
                  const isCurrent = user?.email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleSwitchAccount(acc.email, acc.rol, acc.nombre)}
                      className={`text-left px-3 py-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? "bg-indigo-600 text-white font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <p className={isCurrent ? "text-white" : "font-semibold text-slate-800"}>
                          {acc.badge}
                        </p>
                        <p className={`text-[10px] ${isCurrent ? "text-indigo-100" : "text-slate-400"}`}>
                          {acc.email}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="text-xs bg-indigo-500 px-1.5 py-0.5 rounded text-white font-bold">
                          Activo
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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
