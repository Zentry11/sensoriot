import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function ConfiguracionAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

  const [admin, setAdmin] = useState({
    id: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    correo: "",
    rol: "",
  });

  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  //  Obtener perfil del admin
  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmin(res.data);
      } catch (error) {
        console.error("❌ Error al obtener perfil:", error);
        toast.error("⚠️ No se pudo cargar el perfil");
      }
    };
    obtenerPerfil();
  }, [API_URL, token]);

  //  Guardar cambios de perfil
  const guardarPerfil = async (e) => {
    e.preventDefault();

    //  Validaciones
    if (
      !admin.nombres.trim() ||
      !admin.apellidos.trim() ||
      !admin.telefono.trim() ||
      !admin.correo.trim()
    ) {
      toast.warn("⚠️ Todos los campos son obligatorios");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin.correo)) {
      toast.warn("⚠️ Ingresa un correo electrónico válido");
      return;
    }

    try {
      await axios.put(`${API_URL}/api/admin/perfil`, admin, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Perfil actualizado correctamente");
    } catch (error) {
      console.error("❌ Error al guardar perfil:", error);
      toast.error("⚠️ No se pudo actualizar el perfil");
    }
  };

  //  Cambiar contraseña
  const cambiarContraseña = async (e) => {
    e.preventDefault();

    if (!nuevaContraseña.trim() || !confirmarContraseña.trim()) {
      toast.warn("⚠️ Debes ingresar y confirmar la nueva contraseña");
      return;
    }

    if (nuevaContraseña !== confirmarContraseña) {
      toast.error("❌ Las contraseñas no coinciden");
      return;
    }

    if (nuevaContraseña.length < 6) {
      toast.warn("⚠️ La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      await axios.put(
        `${API_URL}/api/admin/cambiar-contraseña`,
        { nuevaContraseña },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("🔒 Contraseña actualizada correctamente");
      setNuevaContraseña("");
      setConfirmarContraseña("");
    } catch (error) {
      console.error("❌ Error al cambiar contraseña:", error);
      toast.error("⚠️ No se pudo cambiar la contraseña");
    }
  };

  //  Sidebar Responsive
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
            aria-label="Cerrar menú"
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
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              ⚙️ Configuración de Cuenta (Admin)
            </h1>

            {/* Datos de perfil */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                 Datos Personales
              </h2>
              <form onSubmit={guardarPerfil} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                  <input
                    type="text"
                    placeholder="Nombres"
                    value={admin.nombres}
                    onChange={(e) => setAdmin({ ...admin, nombres: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    placeholder="Apellidos"
                    value={admin.apellidos}
                    onChange={(e) => setAdmin({ ...admin, apellidos: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={admin.telefono}
                    onChange={(e) => setAdmin({ ...admin, telefono: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                  <input
                    type="email"
                    placeholder="Correo"
                    value={admin.correo}
                    onChange={(e) => setAdmin({ ...admin, correo: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white font-semibold rounded-lg py-2 px-6 hover:bg-emerald-700 transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>

            {/* Cambio de contraseña */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                 Cambiar Contraseña
              </h2>
              <form onSubmit={cambiarContraseña} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Nueva Contraseña"
                    value={nuevaContraseña}
                    onChange={(e) => setNuevaContraseña(e.target.value)}
                    className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Confirmar Contraseña"
                    value={confirmarContraseña}
                    onChange={(e) => setConfirmarContraseña(e.target.value)}
                    className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white font-semibold rounded-lg py-2 hover:bg-emerald-700 transition-colors"
                >
                  Actualizar Contraseña
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
