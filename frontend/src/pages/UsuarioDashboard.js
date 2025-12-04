import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from "recharts";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

export default function UsuarioDashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();

  const [datos, setDatos] = useState(null);
  const [pulseras, setPulseras] = useState([]);
  const [codigo, setCodigo] = useState(localStorage.getItem("pulseraSeleccionada") || "");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
  const errorShownRef = useRef(false);

  //  Obtener pulseras vinculadas
  const obtenerPulseras = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/monitoreo/mis-pulseras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPulseras(res.data);
    } catch (error) {
      console.error("Error al cargar pulseras:", error);
      toast.error("⚠️ No se pudieron cargar tus pulseras registradas");
    }
  }, [API_URL, token]);

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

  //  Verificar sesión y cargar pulseras
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      obtenerPulseras();
    }
  }, [token, navigate, obtenerPulseras]);

  //  Buscar datos del sensor
  const buscarDatos = useCallback(
    async (tokenPulsera) => {
      if (!tokenPulsera) return;

      try {
        const res = await axios.get(`${API_URL}/api/sensor/alertas/${tokenPulsera}`);
        if (!res.data || Object.keys(res.data).length === 0) {
          if (!errorShownRef.current) {
            toast.error(" No se encontraron datos para esta pulsera");
            errorShownRef.current = true;
          }
          setDatos(null);
          return;
        }
        setDatos(res.data);
        errorShownRef.current = false;
      } catch (err) {
        console.error(err);
        if (!errorShownRef.current) {
          toast.error(" No se encontraron datos para esta pulsera");
          errorShownRef.current = true;
        }
        setDatos(null);
      }
    },
    [API_URL]
  );

  //  Actualizar datos cada 30 segundos
  useEffect(() => {
    if (!codigo) return;
    buscarDatos(codigo);
    const intervalo = setInterval(() => buscarDatos(codigo), 30000);
    return () => clearInterval(intervalo);
  }, [codigo, buscarDatos]);

  //  Guardar la pulsera seleccionada en localStorage
  useEffect(() => {
    if (codigo) {
      localStorage.setItem("pulseraSeleccionada", codigo);
    }
  }, [codigo]);

  //  Función para exportar a Excel (COMPLETA CON SENSORES)
  const exportToExcel = () => {
    if (!datos) {
      toast.error("No hay datos para exportar");
      return;
    }

    try {
      // Crear libro de Excel
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Estadísticas resumen
      const statsSheetData = [
        ["ESTADÍSTICAS RESUMEN"],
        ["", ""],
        ["MOVIMIENTOS BRUSCOS", datos?.movimientos_bruscos || "0"],
        ["ALERTAS TOTALES", datos?.historial?.length || "0"],
        ["PULSERAS ACTIVAS", pulseras.length],
        ["", ""],
        ["FECHA DE EXPORTACIÓN", new Date().toLocaleString('es-ES')],
        ["USUARIO", `${usuario?.nombres} ${usuario?.apellidos}`],
        ["PULSERA SELECCIONADA", codigo],
        ["", ""],
        ["DETALLES SENSORES"],
        ["Total registros con sensores", datos?.historial?.filter(a => a.ax !== null).length || "0"],
        ["Última lectura", datos?.historial?.[0]?.fecha ? new Date(datos.historial[0].fecha).toLocaleString('es-ES') : "N/A"]
      ];
      
      const statsSheet = XLSX.utils.aoa_to_sheet(statsSheetData);
      XLSX.utils.book_append_sheet(wb, statsSheet, "Resumen");

      // Hoja 2: Historial de alertas COMPLETO con sensores
      if (datos.historial && datos.historial.length > 0) {
        const alertasData = datos.historial.map(alerta => {
          let tipo = "General";
          const mensaje = alerta.mensaje.toLowerCase();
          
          if (mensaje.includes('caída') || mensaje.includes('caida')) tipo = "Caída";
          else if (mensaje.includes('brusco')) tipo = "Movimiento Brusco";
          else if (mensaje.includes('temperatura')) tipo = "Temperatura";
          
          return {
            "ID": alerta.id,
            "Tipo": tipo,
            "Mensaje": alerta.mensaje,
            "Fecha": new Date(alerta.fecha).toLocaleString('es-ES'),
            "Fecha Original": alerta.fecha,
            "Temperatura (°C)": alerta.temperatura || "N/A",
            "Aceleración X (m/s²)": alerta.ax ? parseFloat(alerta.ax).toFixed(4) : "N/A",
            "Aceleración Y (m/s²)": alerta.ay ? parseFloat(alerta.ay).toFixed(4) : "N/A",
            "Aceleración Z (m/s²)": alerta.az ? parseFloat(alerta.az).toFixed(4) : "N/A",
            "Giroscopio X (°/s)": alerta.gx ? parseFloat(alerta.gx).toFixed(4) : "N/A",
            "Giroscopio Y (°/s)": alerta.gy ? parseFloat(alerta.gy).toFixed(4) : "N/A",
            "Giroscopio Z (°/s)": alerta.gz ? parseFloat(alerta.gz).toFixed(4) : "N/A",
            "Magnitud Aceleración": alerta.ax && alerta.ay && alerta.az 
              ? Math.sqrt(
                  Math.pow(parseFloat(alerta.ax), 2) + 
                  Math.pow(parseFloat(alerta.ay), 2) + 
                  Math.pow(parseFloat(alerta.az), 2)
                ).toFixed(4) 
              : "N/A"
          };
        });
        
        const alertasSheet = XLSX.utils.json_to_sheet(alertasData);
        XLSX.utils.book_append_sheet(wb, alertasSheet, "Historial Alertas");
      }

      // Hoja 3: Historial de temperatura
      if (datos.historialTemperatura && datos.historialTemperatura.length > 0) {
        const tempData = datos.historialTemperatura.map(item => ({
          "Temperatura (°C)": item.temperatura,
          "Fecha": new Date(item.fecha).toLocaleString('es-ES'),
          "Fecha Original": item.fecha
        }));
        
        const tempSheet = XLSX.utils.json_to_sheet(tempData);
        XLSX.utils.book_append_sheet(wb, tempSheet, "Historial Temperatura");
      }

      // Hoja 4: Últimos registros de sensores (para análisis)
      if (datos.historialSensores && datos.historialSensores.length > 0) {
        const sensoresData = datos.historialSensores.map(item => ({
          "Fecha": new Date(item.fecha).toLocaleString('es-ES'),
          "Hora": item.hora,
          "Aceleración X (m/s²)": parseFloat(item.ax).toFixed(4),
          "Aceleración Y (m/s²)": parseFloat(item.ay).toFixed(4),
          "Aceleración Z (m/s²)": parseFloat(item.az).toFixed(4),
          "Giroscopio X (°/s)": parseFloat(item.gx).toFixed(4),
          "Giroscopio Y (°/s)": parseFloat(item.gy).toFixed(4),
          "Giroscopio Z (°/s)": parseFloat(item.gz).toFixed(4),
          "Magnitud Total Aceleración": Math.sqrt(
            Math.pow(item.ax, 2) + 
            Math.pow(item.ay, 2) + 
            Math.pow(item.az, 2)
          ).toFixed(4),
          "Magnitud Total Giroscopio": Math.sqrt(
            Math.pow(item.gx, 2) + 
            Math.pow(item.gy, 2) + 
            Math.pow(item.gz, 2)
          ).toFixed(4)
        }));
        
        const sensoresSheet = XLSX.utils.json_to_sheet(sensoresData);
        XLSX.utils.book_append_sheet(wb, sensoresSheet, "Datos Sensores");
      }

      // Hoja 5: Pulseras registradas
      if (pulseras.length > 0) {
        const pulserasData = pulseras.map(p => ({
          "ID": p.id,
          "Nombre": p.nombre_pulsera,
          "Token": p.token,
          "Fecha Creación": new Date(p.fecha_creacion).toLocaleString('es-ES')
        }));
        
        const pulserasSheet = XLSX.utils.json_to_sheet(pulserasData);
        XLSX.utils.book_append_sheet(wb, pulserasSheet, "Pulseras Registradas");
      }

      // Hoja 6: Estadísticas de sensores (solo si hay datos)
      if (datos.historial && datos.historial.length > 0) {
        const registrosConSensores = datos.historial.filter(a => a.ax !== null);
        
        if (registrosConSensores.length > 0) {
          const valoresAX = registrosConSensores.map(a => parseFloat(a.ax));
          const valoresAY = registrosConSensores.map(a => parseFloat(a.ay));
          const valoresAZ = registrosConSensores.map(a => parseFloat(a.az));
          
          const statsSensoresData = [
            ["ESTADÍSTICAS DE SENSORES"],
            ["", ""],
            ["Total registros con sensores", registrosConSensores.length],
            ["", ""],
            ["ACELERÓMETRO (m/s²)"],
            ["Eje", "Mínimo", "Máximo", "Promedio", "Desviación Estándar"],
            [
              "X",
              Math.min(...valoresAX).toFixed(4),
              Math.max(...valoresAX).toFixed(4),
              (valoresAX.reduce((a, b) => a + b, 0) / valoresAX.length).toFixed(4),
              Math.sqrt(valoresAX.map(x => Math.pow(x - valoresAX.reduce((a, b) => a + b, 0) / valoresAX.length, 2)).reduce((a, b) => a + b, 0) / valoresAX.length).toFixed(4)
            ],
            [
              "Y",
              Math.min(...valoresAY).toFixed(4),
              Math.max(...valoresAY).toFixed(4),
              (valoresAY.reduce((a, b) => a + b, 0) / valoresAY.length).toFixed(4),
              Math.sqrt(valoresAY.map(y => Math.pow(y - valoresAY.reduce((a, b) => a + b, 0) / valoresAY.length, 2)).reduce((a, b) => a + b, 0) / valoresAY.length).toFixed(4)
            ],
            [
              "Z",
              Math.min(...valoresAZ).toFixed(4),
              Math.max(...valoresAZ).toFixed(4),
              (valoresAZ.reduce((a, b) => a + b, 0) / valoresAZ.length).toFixed(4),
              Math.sqrt(valoresAZ.map(z => Math.pow(z - valoresAZ.reduce((a, b) => a + b, 0) / valoresAZ.length, 2)).reduce((a, b) => a + b, 0) / valoresAZ.length).toFixed(4)
            ],
            ["", ""],
            ["NOTA:", "Los valores de giroscopio no se incluyen en estadísticas por ser opcionales"]
          ];
          
          const statsSensoresSheet = XLSX.utils.aoa_to_sheet(statsSensoresData);
          XLSX.utils.book_append_sheet(wb, statsSensoresSheet, "Estadísticas Sensores");
        }
      }

      // Generar nombre del archivo
      const fileName = `reporte_sensores_${codigo || 'pulsera'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Descargar archivo
      XLSX.writeFile(wb, fileName);
      
      toast.success("✅ Reporte exportado exitosamente con datos de sensores");
      
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error("❌ Error al exportar el reporte");
    }
  };

  // 🔐 Cerrar sesión
  const handleLogout = () => {
    setCodigo("");
    setDatos(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    localStorage.removeItem("pulseraSeleccionada");
    navigate("/login");
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const menuItems = [
    { name: "Dashboard", path: "/usuario" },
    { name: "Mis Pulseras", path: "/settings" },
    { name: "Configuracion", path: "/configuracion" },
  ];

  //  Obtener últimos 10 registros de temperatura
  const ultimasTemperaturas = datos?.historialTemperatura 
    ? datos.historialTemperatura.slice(-10).map(item => ({
        ...item,
        hora: new Date(item.fecha).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }))
    : [];

  //  Obtener datos de sensores para gráficas
  const datosSensores = datos?.historialSensores || [];

  //  Funciones para nuevas gráficas
  const obtenerFrecuenciaAlertas = () => {
    if (!datos?.historial) return [];
    
    const frecuencia = datos.historial.reduce((acc, alerta) => {
      let tipo = 'Otro';
      const mensaje = alerta.mensaje.toLowerCase();
      
      if (mensaje.includes('caída') || mensaje.includes('caida')) tipo = 'Caída';
      else if (mensaje.includes('brusco')) tipo = 'Movimiento Brusco';
      else if (mensaje.includes('temperatura')) tipo = 'Temperatura';
      
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(frecuencia).map(([name, value]) => ({ name, value }));
  };

  const obtenerMovimientosPorHora = () => {
    if (!datos?.historial) return [];
    
    const movimientosPorHora = Array.from({ length: 24 }, (_, i) => ({
      hora: `${i}:00`,
      movimientos: 0
    }));

    datos.historial.forEach(alerta => {
      if (alerta.mensaje.toLowerCase().includes('brusco')) {
        const hora = new Date(alerta.fecha).getHours();
        movimientosPorHora[hora].movimientos++;
      }
    });

    return movimientosPorHora;
  };

  const obtenerActividadDiaria = () => {
    if (!datos?.historial) return [];
    
    const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const actividad = ultimos7Dias.map(fecha => {
      const alertasDelDia = datos.historial.filter(a => 
        a.fecha.split('T')[0] === fecha
      );
      
      return {
        fecha: new Date(fecha).toLocaleDateString('es-ES', { weekday: 'short' }),
        alertas: alertasDelDia.length,
        movimientos: alertasDelDia.filter(a => a.mensaje.toLowerCase().includes('brusco')).length,
        caidas: alertasDelDia.filter(a => a.mensaje.toLowerCase().includes('caída') || a.mensaje.toLowerCase().includes('caida')).length
      };
    });

    return actividad;
  };

  //  Datos para gráficas
  const frecuenciaAlertas = obtenerFrecuenciaAlertas();
  const movimientosPorHora = obtenerMovimientosPorHora();
  const actividadDiaria = obtenerActividadDiaria();

  //  Estadísticas
  const statsData = [
    {
      title: "MOVIMIENTOS BRUSCOS",
      value: datos?.movimientos_bruscos || "0",
      color: "bg-red-500",
    },
    {
      title: "ALERTAS TOTALES",
      value: datos?.historial?.length || "0",
      color: "bg-orange-500",
    },
    {
      title: "TEMPERATURA ACTUAL",
      value: ultimasTemperaturas.length > 0 
        ? `${ultimasTemperaturas[ultimasTemperaturas.length - 1]?.temperatura || 0}°C`
        : "0°C",
      color: "bg-blue-500",
    },
    {
      title: "PULSERAS ACTIVAS",
      value: pulseras.length.toString(),
      color: "bg-green-500",
    },
  ];

  // Overlay móvil
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

      {/* Sidebar */}
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
        {/* Encabezado móvil */}
        <div className="md:hidden bg-white shadow-sm border-b p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ☰
          </button>
          <h1 className="text-lg font-bold text-emerald-700">Dashboard</h1>
          <div className="w-8"></div>
        </div>

        {/* Contenido */}
        <div className="p-4 md:p-8 min-h-screen bg-emerald-50">
          <div className="max-w-7xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Bienvenido, {usuario?.nombres} {usuario?.apellidos}
                </h1>
                <p className="text-gray-600 mt-1">
                  Monitor de actividad de tus pulseras registradas
                </p>
              </div>

              {/*  Selector de pulseras y botón de exportación */}
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  value={codigo}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCodigo(value);
                    localStorage.setItem("pulseraSeleccionada", value);
                    errorShownRef.current = false;
                    buscarDatos(value);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none w-full md:w-64 bg-white"
                >
                  <option value="">🔍 Buscar Pulsera...</option>
                  {pulseras.map((p) => (
                    <option key={p.id} value={p.token}>
                      {p.nombre_pulsera}
                    </option>
                  ))}
                </select>
                
                {/* Botón de exportación */}
                <button
                  onClick={exportToExcel}
                  disabled={!datos}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    datos 
                      ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <span>📊</span>
                  Exportar a Excel
                </button>
              </div>
            </div>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsData.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className={`${stat.color} p-4 rounded-full mb-4`}>
                      <span className="text-white text-2xl">
                        {stat.title.includes("MOVIMIENTOS")
                          ? "⚠️"
                          : stat.title.includes("ALERTAS")
                          ? "🚨"
                          : stat.title.includes("TEMPERATURA")
                          ? "🌡️"
                          : "📱"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráficas - Primera Fila */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Temperatura - Últimos 10 registros */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📊 Temperatura - Últimos 10 Registros
                </h3>
                {ultimasTemperaturas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ultimasTemperaturas}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="hora"
                        tick={{ fill: "#4B5563", fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: "#4B5563", fontSize: 12 }}
                        domain={['dataMin - 1', 'dataMax + 1']}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}°C`, 'Temperatura']}
                        labelFormatter={(label) => `Hora: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="temperatura"
                        name="Temperatura (°C)"
                        barSize={20}
                        fill="#10b981"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No hay datos de temperatura para esta pulsera
                  </div>
                )}
              </div>

              {/* Actividad Diaria */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📅 Actividad de los Últimos 7 Días
                </h3>
                {actividadDiaria.some(dia => dia.alertas > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={actividadDiaria}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="fecha" 
                        tick={{ fill: "#4B5563", fontSize: 12 }} 
                      />
                      <YAxis 
                        tick={{ fill: "#4B5563", fontSize: 12 }} 
                      />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="alertas" 
                        name="Total Alertas" 
                        fill="#10B981" 
                      />
                      <Bar 
                        dataKey="movimientos" 
                        name="Movimientos Bruscos" 
                        fill="#F59E0B" 
                      />
                      <Bar 
                        dataKey="caidas" 
                        name="Caídas" 
                        fill="#EF4444" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No hay actividad registrada en los últimos 7 días
                  </div>
                )}
              </div>
            </div>

            {/* Gráficas - Segunda Fila */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Frecuencia de Alertas por Tipo */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📈 Frecuencia de Alertas por Tipo
                </h3>
                {frecuenciaAlertas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={frecuenciaAlertas}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: "#4B5563", fontSize: 12 }} 
                      />
                      <YAxis 
                        tick={{ fill: "#4B5563", fontSize: 12 }} 
                      />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name="Cantidad de Alertas" 
                        fill="#8B5CF6" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No hay alertas registradas
                  </div>
                )}
              </div>

              {/* Movimientos por Hora */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  🕒 Movimientos Bruscos por Hora del Día
                </h3>
                {movimientosPorHora.some(h => h.movimientos > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={movimientosPorHora}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="hora" 
                        tick={{ fill: "#4B5563", fontSize: 12 }} 
                      />
                      <YAxis 
                        tick={{ fill: "#4B5563", fontSize: 12 }} 
                      />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="movimientos" 
                        name="Movimientos Bruscos" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No hay movimientos bruscos registrados
                  </div>
                )}
              </div>
            </div>

            {/* Gráficas - Tercera Fila (Nuevas gráficas de sensores) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Acelerómetro */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📊 Acelerómetro (ax, ay, az) - Últimos 10 Registros
                </h3>
                {datosSensores.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={datosSensores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="hora"
                        tick={{ fill: "#4B5563", fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: "#4B5563", fontSize: 12 }}
                        label={{ value: 'Aceleración (m/s²)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value} m/s²`, name]}
                        labelFormatter={(label) => `Hora: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="ax" 
                        name="Aceleración X" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ay" 
                        name="Aceleración Y" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="az" 
                        name="Aceleración Z" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No hay datos del acelerómetro para esta pulsera
                  </div>
                )}
              </div>

              {/* Giroscopio */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📈 Giroscopio (gx, gy, gz) - Últimos 10 Registros
                </h3>
                {datosSensores.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={datosSensores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="hora"
                        tick={{ fill: "#4B5563", fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: "#4B5563", fontSize: 12 }}
                        label={{ value: 'Velocidad Angular (°/s)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value} °/s`, name]}
                        labelFormatter={(label) => `Hora: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="gx" 
                        name="Giroscopio X" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="gy" 
                        name="Giroscopio Y" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="gz" 
                        name="Giroscopio Z" 
                        stroke="#EC4899" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No hay datos del giroscopio para esta pulsera
                  </div>
                )}
              </div>
            </div>

            {/* Historial de alertas */}
            {datos && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    📋 Historial de Alertas (Últimas 10)
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          Tipo
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          Mensaje
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          Fecha y Hora
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          Sensores
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          ID
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.historial.length > 0 ? (
                        datos.historial
                          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                          .slice(0, 10)
                          .map((alerta, index) => {
                            const esCaida = alerta.mensaje.toLowerCase().includes('caída') || alerta.mensaje.toLowerCase().includes('caida');
                            const esMovimiento = alerta.mensaje.toLowerCase().includes('brusco');
                            const esTemperatura = alerta.mensaje.toLowerCase().includes('temperatura');
                            
                            let tipo = "General";
                            let color = "blue";
                            let icono = "📄";
                            
                            if (esCaida) {
                              tipo = "Caída";
                              color = "red";
                              icono = "🚨";
                            } else if (esMovimiento) {
                              tipo = "Movimiento";
                              color = "yellow";
                              icono = "⚠️";
                            } else if (esTemperatura) {
                              tipo = "Temperatura";
                              color = "blue";
                              icono = "🌡️";
                            }

                            // Mostrar datos de sensores si existen
                            const tieneSensores = alerta.ax !== null || alerta.ay !== null || alerta.az !== null;
                            const datosSensor = tieneSensores ? (
                              <div className="text-xs text-gray-500">
                                {alerta.ax !== null && <div>ax: {parseFloat(alerta.ax).toFixed(2)}</div>}
                                {alerta.ay !== null && <div>ay: {parseFloat(alerta.ay).toFixed(2)}</div>}
                                {alerta.az !== null && <div>az: {parseFloat(alerta.az).toFixed(2)}</div>}
                              </div>
                            ) : "N/A";

                            return (
                              <tr
                                key={alerta.id}
                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                  esCaida ? 'bg-red-50 hover:bg-red-100' : ''
                                }`}
                              >
                                <td className="p-3">
                                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
                                    <span className="mr-1">{icono}</span>
                                    {tipo}
                                  </div>
                                </td>
                                <td className="p-3 text-sm text-gray-700 font-medium">
                                  {alerta.mensaje}
                                </td>
                                <td className="p-3 text-sm text-gray-500">
                                  {new Date(alerta.fecha).toLocaleString('es-ES', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="p-3 text-sm text-gray-500">
                                  {datosSensor}
                                </td>
                                <td className="p-3 text-sm text-gray-400">
                                  #{alerta.id}
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center py-4">
                              <span className="text-4xl mb-2">📭</span>
                              <p className="text-gray-600">No hay alertas registradas</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Las alertas aparecerán aquí cuando se detecten eventos
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}