// src/components/Register.tsx
// Formulario de registro público para nuevos clientes y distribuidores con código de referido
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, type Rol } from "../context/auth";
import { API_BASE_URL } from "../services/http";

const Register = () => {
  const [searchParams] = useSearchParams();
  const codigoRefInicial = searchParams.get("ref") || "";

  const [nombre, setNombre] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [refCode, setRefCode] = useState<string>(codigoRefInicial);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          password,
          ref: refCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Falla al registrar la cuenta");
      }

      // Si el backend entrega token tras registro, iniciar sesión automáticamente
      if (data.token) {
        const rol: Rol = data.rol === "admin" ? "admin" : "cliente";
        login({ email: data.email, rol, token: data.token });
        navigate("/tienda");
      } else {
        // Redirigir a login con mensaje
        navigate("/login?registered=true");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error de conexión con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3">
            <span className="text-2xl font-black text-white">MC</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Crear Cuenta</h1>
          <p className="text-slate-500 text-sm mt-1">
            Únete a MultiCatálogo como cliente o distribuidor
          </p>
        </div>

        {codigoRefInicial && (
          <div className="mb-5 p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2.5">
            <span className="text-lg">🤝</span>
            <div>
              <p className="font-semibold">Invitado por un patrocinador</p>
              <p className="text-indigo-700">Código de referido: <span className="font-mono font-bold">{codigoRefInicial}</span></p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition text-sm"
              placeholder="Ej. Laura Méndez"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition text-sm"
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition text-sm"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Código de Referido (Opcional)
            </label>
            <input
              type="text"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition uppercase text-sm font-mono tracking-wider"
              placeholder="Ej. TU, ANA, LUIS"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
          >
            {loading ? "Creando cuenta..." : "Registrarse y Empezar"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes una cuenta registrada?{" "}
          <Link to="/login" className="text-indigo-600 font-bold hover:underline">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
