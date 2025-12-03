import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, rolPermitido }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) {
    // No está logueado
    return <Navigate to="/login" replace />;
  }

  if (rolPermitido && usuario.rol.toLowerCase() !== rolPermitido.toLowerCase()) {
    // Rol incorrecto
    return <Navigate to="/login" replace />;
  }

  return children;
}
