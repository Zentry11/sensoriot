import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function UsuariosAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombres: "",
    apellidos: "",
    telefono: "",
    correo: "",
    contraseña: "",
    rol: "usuario",
  });
  const [editando, setEditando] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 🔄 Obtener usuarios desde backend
  const obtenerUsuarios = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(res.data);
    } catch (error) {
      console.error("❌ Error al obtener usuarios:", error);
      toast.error("⚠️ No se pudieron cargar los usuarios");
    }
  }, [API_URL, token]);

  useEffect(() => {
    obtenerUsuarios();
  }, [obtenerUsuarios]);

  // 📱 Responsive Sidebar
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

  // 🆕 Registrar nuevo usuario
  const registrarUsuario = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/admin/usuarios`, nuevoUsuario, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Usuario registrado correctamente");
      setNuevoUsuario({
        nombres: "",
        apellidos: "",
        telefono: "",
        correo: "",
        contraseña: "",
        rol: "usuario",
      });
      obtenerUsuarios();
    } catch (error) {
      console.error("❌ Error al registrar usuario:", error);
      toast.error("⚠️ Error al registrar usuario");
    }
  };

  // ✏️ Actualizar usuario
  const actualizarUsuario = async (id) => {
    try {
      const usuario = usuarios.find((u) => u.id === id);
      await axios.put(`${API_URL}/api/admin/usuarios/${id}`, usuario, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.info("✅ Usuario actualizado correctamente");
      setEditando(null);
      obtenerUsuarios();
    } catch (error) {
      console.error("❌ Error al actualizar usuario:", error);
      toast.error("⚠️ No se pudo actualizar el usuario");
    }
  };

  // 🗑️ Eliminar usuario
  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.warn("🗑️ Usuario eliminado correctamente");
      obtenerUsuarios();
    } catch (error) {
      console.error("❌ Error al eliminar usuario:", error);
      toast.error("⚠️ Error al eliminar usuario");
    }
  };

  // 🔐 Cerrar sesión
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
        <div className="p-4 md:p-8 min-h-screen bg-emerald-50">
          <div className="max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              👥 Gestión de Usuarios
            </h1>

            {/* Tabla de usuarios */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📋 Lista de Usuarios
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 border-b text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="p-3 border-b text-left text-sm font-semibold text-gray-700">Nombres</th>
                      <th className="p-3 border-b text-left text-sm font-semibold text-gray-700">Apellidos</th>
                      <th className="p-3 border-b text-left text-sm font-semibold text-gray-700">Teléfono</th>
                      <th className="p-3 border-b text-left text-sm font-semibold text-gray-700">Correo</th>
                      <th className="p-3 border-b text-left text-sm font-semibold text-gray-700">Rol</th>
                      <th className="p-3 border-b text-left text-sm font-semibold text-gray-700">Fecha</th>
                      <th className="p-3 border-b text-center text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.length > 0 ? (
                      usuarios.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="p-3 border-b">{u.id}</td>

                          {/* Campos editables */}
                          {editando === u.id ? (
                            <>
                              <td className="p-3 border-b">
                                <input
                                  type="text"
                                  value={u.nombres}
                                  onChange={(e) =>
                                    setUsuarios((prev) =>
                                      prev.map((user) =>
                                        user.id === u.id
                                          ? { ...user, nombres: e.target.value }
                                          : user
                                      )
                                    )
                                  }
                                  className="border rounded px-2 py-1"
                                />
                              </td>
                              <td className="p-3 border-b">
                                <input
                                  type="text"
                                  value={u.apellidos}
                                  onChange={(e) =>
                                    setUsuarios((prev) =>
                                      prev.map((user) =>
                                        user.id === u.id
                                          ? { ...user, apellidos: e.target.value }
                                          : user
                                      )
                                    )
                                  }
                                  className="border rounded px-2 py-1"
                                />
                              </td>
                              <td className="p-3 border-b">
                                <input
                                  type="text"
                                  value={u.telefono}
                                  onChange={(e) =>
                                    setUsuarios((prev) =>
                                      prev.map((user) =>
                                        user.id === u.id
                                          ? { ...user, telefono: e.target.value }
                                          : user
                                      )
                                    )
                                  }
                                  className="border rounded px-2 py-1"
                                />
                              </td>
                              <td className="p-3 border-b">
                                <input
                                  type="email"
                                  value={u.correo}
                                  onChange={(e) =>
                                    setUsuarios((prev) =>
                                      prev.map((user) =>
                                        user.id === u.id
                                          ? { ...user, correo: e.target.value }
                                          : user
                                      )
                                    )
                                  }
                                  className="border rounded px-2 py-1"
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 border-b">{u.nombres}</td>
                              <td className="p-3 border-b">{u.apellidos}</td>
                              <td className="p-3 border-b">{u.telefono}</td>
                              <td className="p-3 border-b">{u.correo}</td>
                            </>
                          )}

                          <td className="p-3 border-b">
                            <select
                              value={u.rol}
                              onChange={(e) =>
                                setUsuarios((prev) =>
                                  prev.map((user) =>
                                    user.id === u.id
                                      ? { ...user, rol: e.target.value }
                                      : user
                                  )
                                )
                              }
                              className="border rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="admin">Admin</option>
                              <option value="usuario">Usuario</option>
                            </select>
                          </td>

                          <td className="p-3 border-b text-sm text-gray-500">
                            {new Date(u.fecha_registro).toLocaleDateString()}
                          </td>

                          <td className="p-3 border-b text-center space-x-2">
                            {editando === u.id ? (
                              <button
                                onClick={() => actualizarUsuario(u.id)}
                                className="bg-emerald-600 text-white px-3 py-1 rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium"
                              >
                                Guardar
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditando(u.id)}
                                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                              >
                                Editar
                              </button>
                            )}
                            <button
                              onClick={() => eliminarUsuario(u.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="p-4 text-center text-gray-500">
                          No hay usuarios registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Registrar nuevo usuario */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ➕ Registrar Nuevo Usuario
              </h2>
              <form
                onSubmit={registrarUsuario}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <input
                  type="text"
                  placeholder="Nombres"
                  value={nuevoUsuario.nombres}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, nombres: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Apellidos"
                  value={nuevoUsuario.apellidos}
                  onChange={(e) =>
                    setNuevoUsuario({
                      ...nuevoUsuario,
                      apellidos: e.target.value,
                    })
                  }
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={nuevoUsuario.telefono}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Correo"
                  value={nuevoUsuario.correo}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={nuevoUsuario.contraseña}
                  onChange={(e) =>
                    setNuevoUsuario({
                      ...nuevoUsuario,
                      contraseña: e.target.value,
                    })
                  }
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <select
                  value={nuevoUsuario.rol}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Admin</option>
                </select>

                <div className="flex space-x-2 md:col-span-3">
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white font-semibold rounded-lg py-2 px-4 hover:bg-emerald-700 transition-colors"
                  >
                    Registrar Usuario
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNuevoUsuario({
                        nombres: "",
                        apellidos: "",
                        telefono: "",
                        correo: "",
                        contraseña: "",
                        rol: "usuario",
                      })
                    }
                    className="bg-gray-400 text-white font-semibold rounded-lg py-2 px-4 hover:bg-gray-500 transition-colors"
                  >
                    Limpiar Campos
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
