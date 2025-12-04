import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Settings() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();

  const [pulseras, setPulseras] = useState([]);
  const [nuevoToken, setNuevoToken] = useState("");
  const [nombrePulsera, setNombrePulsera] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

  //  Detectar si es móvil
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  //  Obtener pulseras vinculadas
  const obtenerPulseras = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/monitoreo/mis-pulseras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPulseras(res.data);
    } catch (error) {
      console.error("Error al cargar pulseras:", error);
      toast.error(" Error al cargar las pulseras vinculadas");
    }
  };

  //  Verificar sesión y cargar pulseras
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      obtenerPulseras();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  //  Registrar nueva pulsera
  const registrarPulsera = async () => {
    if (!nuevoToken.trim()) {
      toast.warn(" Ingresa un token válido");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/api/monitoreo/registrar`,
        { token: nuevoToken, nombre_pulsera: nombrePulsera },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.mensaje || " Pulsera registrada correctamente");
      setNuevoToken("");
      setNombrePulsera("");
      obtenerPulseras();
    } catch (error) {
      console.error("Error al registrar:", error);
      toast.error(error.response?.data?.error || "Error al registrar la pulsera");
    }
  };

  // Eliminar pulsera
  const eliminarPulsera = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta pulsera?")) return;

    try {
      await axios.delete(`${API_URL}/api/monitoreo/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Pulsera eliminada correctamente");
      obtenerPulseras();
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error(" No se pudo eliminar la pulsera");
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const menuItems = [
    { name: "Dashboard", path: "/usuario" },
    { name: "Mis Pulseras", path: "/settings" },
    { name: "Configuracion", path: "/configuracion" },
  ];

  const SidebarOverlay = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  );

  return (
    <div className="flex min-h-screen bg-emerald-50">
      {/* Overlay móvil */}
      {sidebarOpen && isMobile && <SidebarOverlay />}

      {/* Sidebar*/}
      <div
        className={`fixed md:relative z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } w-64 bg-emerald-700 text-white shadow-xl transition-all duration-300 ease-in-out h-screen flex flex-col`}
      >
        <div className="p-4 border-b border-emerald-600 flex items-center justify-between h-16">
          <h2 className="text-xl font-bold">Panel Usuario</h2>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-emerald-600 transition-colors md:hidden"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-emerald-900 font-semibold text-emerald-100"
                      : "hover:bg-emerald-600"
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded-lg text-red-200 hover:bg-red-500 hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 min-h-screen overflow-auto">
        <div className="md:hidden bg-white shadow-sm border-b p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ☰
          </button>
          <h1 className="text-lg font-bold text-emerald-700">Mis Pulseras</h1>
          <div className="w-8"></div>
        </div>

        <div className="p-4 md:p-8 min-h-screen bg-emerald-50">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
              ➕ Vincular Nueva Pulsera
            </h1>

            <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Pulsera
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pulsera de Daniel"
                    value={nombrePulsera}
                    onChange={(e) => setNombrePulsera(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token de Pulsera
                  </label>
                  <input
                    type="text"
                    placeholder="Ingresa el token"
                    value={nuevoToken}
                    onChange={(e) => setNuevoToken(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 text-right">
                <button
                  onClick={registrarPulsera}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Registrar Pulsera
                </button>
              </div>
            </div>

            {/* Lista de pulseras registradas */}
            <div className="bg-white shadow-lg rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Mis Pulseras Registradas
              </h2>

              {pulseras.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  No tienes pulseras registradas aún.
                </p>
              ) : (
                <table className="w-full border border-gray-200 rounded-lg shadow-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b">
                        Nombre
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b">
                        Token
                      </th>
                      <th className="p-3 text-right text-sm font-semibold text-gray-700 border-b">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pulseras.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 border-b text-sm text-gray-700">{p.nombre_pulsera}</td>
                        <td className="p-3 border-b text-sm text-gray-700">{p.token}</td>
                        <td className="p-3 border-b text-right">
                          <button
                            onClick={() => eliminarPulsera(p.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}