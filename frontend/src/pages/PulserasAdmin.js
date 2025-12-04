import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function PulserasAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

  const [pulseras, setPulseras] = useState([]);
  const [editando, setEditando] = useState(null);
  const [pulseraEditada, setPulseraEditada] = useState({ codigo: "", token: "", estado: "" });
  const [nuevaPulsera, setNuevaPulsera] = useState({ codigo: "", token: "", estado: "activo" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const obtenerPulseras = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/pulseras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPulseras(res.data);
    } catch (error) {
      console.error("❌ Error al obtener pulseras:", error);
      toast.error("⚠️ No se pudieron cargar las pulseras registradas");
    }
  }, [API_URL, token]);

  useEffect(() => {
    obtenerPulseras();
  }, [obtenerPulseras]);

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

  //  Registrar nueva pulsera con validación
  const registrarPulsera = async (e) => {
    e.preventDefault();
    if (!nuevaPulsera.codigo.trim() || !nuevaPulsera.token.trim()) {
      toast.warn("⚠️ Todos los campos son obligatorios");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/admin/pulseras`, nuevaPulsera, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data.mensaje || "✅ Pulsera registrada exitosamente");
      setNuevaPulsera({ codigo: "", token: "", estado: "activo" });
      obtenerPulseras();
    } catch (error) {
      console.error("❌ Error al registrar pulsera:", error);
      toast.error("⚠️ Error al registrar la pulsera");
    }
  };

  //  Iniciar edición
  const iniciarEdicion = (pulsera) => {
    setEditando(pulsera.id);
    setPulseraEditada({ ...pulsera });
  };

  //  Guardar cambios
  const guardarEdicion = async (id) => {
    if (!pulseraEditada.codigo.trim() || !pulseraEditada.token.trim()) {
      toast.warn("⚠️ Código y token no pueden estar vacíos");
      return;
    }
    try {
      const res = await axios.put(
        `${API_URL}/api/admin/pulseras/${id}`,
        {
          codigo: pulseraEditada.codigo,
          token: pulseraEditada.token,
          estado: pulseraEditada.estado,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.mensaje || "✅ Pulsera actualizada correctamente");
      setEditando(null);
      obtenerPulseras();
    } catch (error) {
      console.error("❌ Error al guardar cambios:", error);
      toast.error("⚠️ No se pudo actualizar la pulsera");
    }
  };

  //  Eliminar pulsera
  const eliminarPulsera = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta pulsera?")) return;
    try {
      const res = await axios.delete(`${API_URL}/api/admin/pulseras/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.warn(res.data.mensaje || "🗑️ Pulsera eliminada");
      obtenerPulseras();
    } catch (error) {
      console.error("❌ Error al eliminar pulsera:", error);
      toast.error("⚠️ Error al eliminar la pulsera");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const menuItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Pulseras", path: "/pulserasAdmin" },
    { name: "Usuarios", path: "/usuariosAdmin" },
    { name: "Monitoreos", path: "/monitoreoAdmin" },
    { name: "Configuración", path: "/configuracionAdmin" },
  ];

  const SidebarOverlay = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  );

  return (
    <div className="flex min-h-screen bg-emerald-50">
      {sidebarOpen && isMobile && <SidebarOverlay />}
      <div
        className={`fixed md:relative z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } w-64 bg-emerald-700 text-white shadow-xl transition-all duration-300 ease-in-out h-screen flex flex-col`}
      >
        <div className="p-4 border-b border-emerald-600 flex items-center justify-between h-16">
          <h2 className="text-xl font-bold">Panel Admin</h2>
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

      <div className="flex-1 min-h-screen overflow-auto">
        <div className="md:hidden bg-white shadow-sm border-b p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ☰
          </button>
          <h1 className="text-lg font-bold text-emerald-700">Pulseras</h1>
          <div className="w-8"></div>
        </div>

        <div className="p-4 md:p-8 min-h-screen bg-emerald-50">
          <div className="max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6"> 📱Gestión de Pulseras</h1>

            {/* 📋 Tabla de pulseras */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📄 Lista de Pulseras Registradas
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 border-b text-left">ID</th>
                      <th className="p-3 border-b text-left">Código</th>
                      <th className="p-3 border-b text-left">Token</th>
                      <th className="p-3 border-b text-left">Estado</th>
                      <th className="p-3 border-b text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pulseras.length > 0 ? (
                      pulseras.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="p-3 border-b">{p.id}</td>

                          {/* Código */}
                          <td className="p-3 border-b">
                            {editando === p.id ? (
                              <input
                                type="text"
                                value={pulseraEditada.codigo}
                                onChange={(e) =>
                                  setPulseraEditada({ ...pulseraEditada, codigo: e.target.value })
                                }
                                className="border border-gray-300 rounded px-2 py-1 w-full"
                              />
                            ) : (
                              p.codigo
                            )}
                          </td>

                          {/* Token */}
                          <td className="p-3 border-b">
                            {editando === p.id ? (
                              <input
                                type="text"
                                value={pulseraEditada.token}
                                onChange={(e) =>
                                  setPulseraEditada({ ...pulseraEditada, token: e.target.value })
                                }
                                className="border border-gray-300 rounded px-2 py-1 w-full"
                              />
                            ) : (
                              p.token
                            )}
                          </td>

                          {/* Estado */}
                          <td className="p-3 border-b">
                            <select
                              value={
                                editando === p.id
                                  ? pulseraEditada.estado
                                  : p.estado
                              }
                              onChange={(e) =>
                                setPulseraEditada({ ...pulseraEditada, estado: e.target.value })
                              }
                              disabled={editando !== p.id}
                              className="border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="activo">Activa</option>
                              <option value="inactivo">Inactiva</option>
                            </select>
                          </td>

                          {/* Acciones */}
                          <td className="p-3 border-b text-center">
                            {editando === p.id ? (
                              <>
                                <button
                                  onClick={() => guardarEdicion(p.id)}
                                  className="bg-emerald-600 text-white px-3 py-1 rounded-md hover:bg-emerald-700 mr-2"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditando(null)}
                                  className="bg-gray-400 text-white px-3 py-1 rounded-md hover:bg-gray-500"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => iniciarEdicion(p)}
                                  className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 mr-2"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => eliminarPulsera(p.id)}
                                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-500">
                          No hay pulseras registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/*  Registrar nueva pulsera */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ➕ Registrar Nueva Pulsera
              </h2>
              <form onSubmit={registrarPulsera} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Código"
                  value={nuevaPulsera.codigo}
                  onChange={(e) =>
                    setNuevaPulsera({ ...nuevaPulsera, codigo: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Token"
                  value={nuevaPulsera.token}
                  onChange={(e) =>
                    setNuevaPulsera({ ...nuevaPulsera, token: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={nuevaPulsera.estado}
                  onChange={(e) =>
                    setNuevaPulsera({ ...nuevaPulsera, estado: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="activo">Activa</option>
                  <option value="inactivo">Inactiva</option>
                </select>
                <button
                  type="submit"
                  className="md:col-span-3 bg-emerald-600 text-white font-semibold rounded-lg py-2 hover:bg-emerald-700 transition-colors"
                >
                  Registrar Pulsera
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
