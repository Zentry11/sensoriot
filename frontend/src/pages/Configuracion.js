import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Configuracion() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

  const [userData, setUserData] = useState({
    nombres: "",
    apellidos: "",
    telefono: "",
    correo: "",
    password: "",
    confirmPassword: "",
  });

  //  Cargar datos del usuario al montar
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_URL}/api/usuarios/${usuario.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUserData({
          nombres: response.data.nombres || "",
          apellidos: response.data.apellidos || "",
          telefono: response.data.telefono || "",
          correo: response.data.correo || "",
          password: "",
          confirmPassword: "",
        });
      } catch (error) {
        console.error("❌ Error al obtener usuario:", error);
        toast.error("Error al cargar los datos del usuario 😞");
      }
    };

    if (usuario?.id) fetchUser();
  }, [usuario?.id, API_URL]);

  //  Detectar si es móvil
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // En desktop, sidebar abierto por defecto
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  //  Cerrar sesión
  const handleLogout = () => {
    // Limpiar el estado local antes de cerrar sesión
    setUserData({
      nombres: "",
      apellidos: "",
      telefono: "",
      correo: "",
      password: "",
      confirmPassword: "",
    });
    
    // Pequeño delay para asegurar que se limpie el estado antes de navegar
    setTimeout(() => {
      localStorage.removeItem("usuario");
      localStorage.removeItem("token");
      navigate("/login");
    }, 100);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  //  Cambios de input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //  Guardar cambios
  const handleSaveSettings = async (e) => {
    e.preventDefault();

    // Validar contraseña
    if (userData.password && userData.password !== userData.confirmPassword) {
      toast.warn("⚠️ Las contraseñas no coinciden");
      return;
    }

    // Confirmación si no cambia contraseña
    if (!userData.password && !userData.confirmPassword) {
      const confirmKeep = window.confirm(
        "¿Deseas mantener tu contraseña actual?"
      );
      if (!confirmKeep) return;
    }

    try {
      const token = localStorage.getItem("token");
      const updateData = {
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        telefono: userData.telefono,
        correo: userData.correo,
      };
      if (userData.password) updateData.password = userData.password;

      await axios.put(`${API_URL}/api/usuarios/${usuario.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Actualiza el localStorage
      const updatedUser = { ...usuario, ...updateData };
      localStorage.setItem("usuario", JSON.stringify(updatedUser));

      toast.success("✅ Datos actualizados correctamente");

      setUserData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
    } catch (err) {
      console.error(err);
      toast.error("❌ Error al actualizar los datos");
    }
  };

  const menuItems = [
    { name: "Dashboard", path: "/usuario" },
    { name: "Mis Pulseras", path: "/settings" },
    { name: "Configuracion", path: "/configuracion" },
  ];

  // Overlay para móviles cuando el sidebar está abierto
  const SidebarOverlay = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  );

  return (
    <div className="flex min-h-screen bg-emerald-50">
      {/* Overlay para móviles */}
      {sidebarOpen && isMobile && <SidebarOverlay />}

      {/* Sidebar  */}
      <div 
        className={`
          fixed md:relative z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          w-64 bg-emerald-700 text-white shadow-xl transition-all duration-300 ease-in-out
          h-screen flex flex-col
        `}
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

        {/* Contenedor con scroll independiente */}
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
            {/* Opción de Cerrar Sesión */}
            <button
              onClick={() => {
                handleLogout();
                if (isMobile) setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg text-red-200 hover:bg-red-500 hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white shadow-sm border-b p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ☰
          </button>
          <h1 className="text-lg font-bold text-emerald-700">Configuración</h1>
          <div className="w-8"></div>
        </div>

        <div className="p-4 md:p-8 min-h-screen bg-emerald-50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Mi Cuenta
              </h1>
              <p className="text-gray-600 mb-6">
                Gestiona la información de tu cuenta y actualiza tus datos personales
              </p>

              <form onSubmit={handleSaveSettings}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombres
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      value={userData.nombres}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      value={userData.apellidos}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={userData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      name="correo"
                      value={userData.correo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Sección de contraseña */}
                <div className="border-t pt-8 mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Cambiar Contraseña
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={userData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Dejar vacío para mantener"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={userData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Confirmar nueva contraseña"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate("/usuario")}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Guardar Cambios
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