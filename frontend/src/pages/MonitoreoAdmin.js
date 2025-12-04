import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function MonitoreoAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

  const [monitoreos, setMonitoreos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pulseras, setPulseras] = useState([]);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    usuario_id: "",
    token: "",
    nombre_pulsera: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  //  Obtener datos iniciales
  const obtenerDatos = useCallback(async () => {
    try {
      const [monRes, usuRes, pulRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/monitoreos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/monitoreos/usuarios`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/monitoreos/pulseras`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setMonitoreos(monRes.data);
      setUsuarios(usuRes.data);
      setPulseras(pulRes.data);
    } catch (error) {
      console.error("❌ Error al obtener datos:", error);
      toast.error("⚠️ Error al obtener los datos de monitoreo");
    }
  }, [API_URL, token]);

  useEffect(() => {
    obtenerDatos();
  }, [obtenerDatos]);

  //  Sidebar responsiva
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //  Registrar o editar monitoreo
  const manejarSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await axios.put(`${API_URL}/api/admin/monitoreos/${editando}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("✅ Monitoreo actualizado correctamente");
      } else {
        await axios.post(`${API_URL}/api/admin/monitoreos`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("✅ Monitoreo registrado correctamente");
      }
      setFormData({ usuario_id: "", token: "", nombre_pulsera: "" });
      setEditando(null);
      obtenerDatos();
    } catch (error) {
      console.error("❌ Error al guardar monitoreo:", error);
      toast.error("⚠️ Error al guardar monitoreo");
    }
  };

  //  Eliminar monitoreo
  const eliminarMonitoreo = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este monitoreo?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/monitoreos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.warn("🗑️ Monitoreo eliminado");
      obtenerDatos();
    } catch (error) {
      console.error("❌ Error al eliminar monitoreo:", error);
      toast.error("⚠️ Error al eliminar monitoreo");
    }
  };

  const editarMonitoreo = (monitoreo) => {
    setEditando(monitoreo.id);
    setFormData({
      usuario_id: monitoreo.usuario_id,
      token: monitoreo.token,
      nombre_pulsera: monitoreo.nombre_pulsera,
    });
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setFormData({ usuario_id: "", token: "", nombre_pulsera: "" });
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Pulseras", path: "/pulserasAdmin" },
    { name: "Usuarios", path: "/usuariosAdmin" },
    { name: "Monitoreos", path: "/monitoreoAdmin" },
    { name: "Configuración", path: "/configuracionAdmin" },
  ];

  return (
    <div className="flex min-h-screen bg-emerald-50">
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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

      {/* Contenido principal */}
      <div className="flex-1 min-h-screen overflow-auto">
        <div className="p-6 md:p-8 min-h-screen bg-emerald-50">
          <div className="max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              📈 Gestión de Monitoreos
            </h1>

            {/*  Tabla de monitoreos */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📄 Lista de Monitoreos
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 border-b text-left">ID</th>
                      <th className="p-3 border-b text-left">Usuario</th>
                      <th className="p-3 border-b text-left">Token</th>
                      <th className="p-3 border-b text-left">Pulsera</th>
                      <th className="p-3 border-b text-left">Fecha</th>
                      <th className="p-3 border-b text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoreos.length > 0 ? (
                      monitoreos.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="p-3 border-b">{m.id}</td>
                          <td className="p-3 border-b">
                            {m.nombre_usuario
                              ? `${m.nombre_usuario} ${m.apellido_usuario || ""}`
                              : `#${m.usuario_id}`}
                          </td>
                          <td className="p-3 border-b">{m.token}</td>
                          <td className="p-3 border-b">{m.nombre_pulsera}</td>
                          <td className="p-3 border-b text-sm text-gray-500">
                            {new Date(m.fecha_registro).toLocaleString()}
                          </td>
                          <td className="p-3 border-b text-center space-x-2">
                            <button
                              onClick={() => editarMonitoreo(m)}
                              className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => eliminarMonitoreo(m.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-sm"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-4 text-center text-gray-500"
                        >
                          No hay registros de monitoreo
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/*  Formulario */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {editando ? "✏️ Editar Monitoreo" : "➕ Registrar Nuevo Monitoreo"}
              </h2>

              <form
                onSubmit={manejarSubmit}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {/* Usuario */}
                <select
                  value={formData.usuario_id}
                  onChange={(e) =>
                    setFormData({ ...formData, usuario_id: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Seleccionar usuario</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>

                {/* Token */}
                <select
                  value={formData.token}
                  onChange={(e) =>
                    setFormData({ ...formData, token: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Seleccionar token</option>
                  {pulseras.map((p) => (
                    <option key={p.id} value={p.token}>
                      {p.codigo} ({p.token})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Nombre de la pulsera"
                  value={formData.nombre_pulsera}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nombre_pulsera: e.target.value,
                    })
                  }
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  required
                />

                <div className="md:col-span-3 flex space-x-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white font-semibold rounded-lg py-2 px-4 hover:bg-emerald-700 transition-colors"
                  >
                    {editando ? "Guardar Cambios" : "Registrar Monitoreo"}
                  </button>

                  {editando && (
                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      className="bg-gray-400 text-white font-semibold rounded-lg py-2 px-4 hover:bg-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
