import { useNavigate } from "react-router-dom";

export default function SidebarUsuario({ sidebarOpen, toggleSidebar, isMobile }) {
  const navigate = useNavigate();

  // 🔐 Cerrar sesión
  const handleLogout = () => {
    // Borrar datos guardados
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    localStorage.removeItem("pulseraSeleccionada"); // ✅ limpia la selección de pulsera

    // Redirigir al login
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/usuario" },
    { name: "Mis Pulseras", path: "/settings" },
    { name: "Configuración", path: "/configuracion" },
  ];

  return (
    <div
      className={`fixed md:relative z-50 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } w-64 bg-white shadow-xl transition-all duration-300 ease-in-out h-screen flex flex-col`}
    >
      {/* Encabezado */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between h-16">
        <h2 className="text-xl font-bold text-emerald-700">SENSOR CAIDAS</h2>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
        >
          ✕
        </button>
      </div>

      {/* Navegación */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Inicio
            </h3>
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) toggleSidebar();
                    }}
                    className="w-full text-left p-3 text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <span className="font-medium">{item.name}</span>
                  </button>
                </li>
              ))}

              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left p-3 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
