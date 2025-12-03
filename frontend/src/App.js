/*import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UsuarioDashboard from "./pages/UsuarioDashboard";
import Configuracion from "./pages/Configuracion";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute rolPermitido="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/usuario" 
            element={
              <ProtectedRoute rolPermitido="usuario">
                <UsuarioDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/configuracion" 
            element={
              <ProtectedRoute rolPermitido="usuario">
                <Configuracion />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
      <ToastContainer 
        position="top-center" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App; */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; 
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UsuarioDashboard from "./pages/UsuarioDashboard";
import Configuracion from "./pages/Configuracion";
import Settings from "./pages/Settings"; // ✅ Importamos la nueva página "Mis Pulseras"
import PulserasAdmin from "./pages/PulserasAdmin";
import UsuariosAdmin from "./pages/UsuariosAdmin";
import MonitoreoAdmin from "./pages/MonitoreoAdmin";
import ConfiguracionAdmin from "./pages/ConfiguracionAdmin";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute rolPermitido="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/pulserasAdmin"
            element={
              <ProtectedRoute rolPermitido="admin">
                <PulserasAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuariosAdmin"
            element={
              <ProtectedRoute rolPermitido="admin">
                <UsuariosAdmin/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/monitoreoAdmin"
            element={
              <ProtectedRoute rolPermitido="admin">
                <MonitoreoAdmin/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/configuracionAdmin"
            element={
              <ProtectedRoute rolPermitido="admin">
                <ConfiguracionAdmin/>
              </ProtectedRoute>
            }
          />


          <Route 
            path="/usuario" 
            element={
              <ProtectedRoute rolPermitido="usuario">
                <UsuarioDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/configuracion" 
            element={
              <ProtectedRoute rolPermitido="usuario">
                <Configuracion />
              </ProtectedRoute>
            } 
          />

          {/* ✅ Nueva ruta para Mis Pulseras */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute rolPermitido="usuario">
                <Settings />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>

      {/* ✅ Notificaciones globales */}
      <ToastContainer 
        position="top-center" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;

