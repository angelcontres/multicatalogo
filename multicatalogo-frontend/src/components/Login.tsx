// src/components/Login.tsx
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, type Rol } from "../context/auth";
import { API_BASE_URL } from "../services/http";

const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(async (response) => {
        if (!response.ok) {
          let msg = "Credenciales incorrectas";
          try {
            const data = await response.json();
            if (data.message) msg = data.message;
            else if (data.error) msg = data.error;
          } catch {
            // Ignorar error al parsear JSON no estructurado
          }
          throw new Error(msg);
        }
        return response.json();
      })
      .then((data) => {
        setError("");
        const rol: Rol = data.rol === "admin" ? "admin" : "cliente";
        login({ email: data.email, rol, token: data.token });
        navigate(rol === "admin" ? "/" : "/tienda");
      })
      .catch((err) => {
        setError(err.message || "Error al conectar con el servidor");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">MultiCatálogo</h2>
          <p className="text-slate-500 mt-2">
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
              placeholder="admin@upse.edu.ec"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
              placeholder="••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Validando..." : "Iniciar Sesión"}
          </button>

          <div className="text-center text-sm text-slate-600 pt-2">
            ¿No tienes cuenta?{" "}
            <Link to="/registro" className="text-indigo-600 font-bold hover:underline">
              Regístrate gratis
            </Link>
          </div>
        </form>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-700">Cuentas de prueba (clic para autocompletar):</p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@upse.edu.ec");
                setPassword("123456");
              }}
              className="text-left p-2 rounded bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer flex justify-between items-center"
            >
              <span>👑 <strong className="text-slate-800">Admin:</strong> admin@upse.edu.ec</span>
              <span className="font-mono text-slate-400">123456</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("cliente@upse.edu.ec");
                setPassword("123456");
              }}
              className="text-left p-2 rounded bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer flex justify-between items-center"
            >
              <span>🛍️ <strong className="text-slate-800">Cliente:</strong> cliente@upse.edu.ec</span>
              <span className="font-mono text-slate-400">123456</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
