import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-slate-700">
        MultiCatálogo
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link
          to="/"
          className="block p-3 rounded hover:bg-slate-800 transition"
        >
          Dashboard
        </Link>

        <Link
          to="/catalogo"
          className="block p-3 rounded hover:bg-slate-800 transition"
        >
          Catálogo
        </Link>

        <Link
          to="/mi-red"
          className="block p-3 rounded hover:bg-slate-800 transition"
        >
          Mi Red
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;