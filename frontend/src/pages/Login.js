/*import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //const res = await axios.post("http://localhost:3000/api/auth/login", { correo, contraseña });
      
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { correo, contraseña });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("usuario", JSON.stringify(res.data.usuario));
      // Redirigir según rol
      res.data.usuario.rol === "admin" ? navigate("/admin") : navigate("/usuario");
    } catch (err) {
      alert(err.response?.data?.error || "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        <input 
          type="email" 
          placeholder="Correo" 
          value={correo} 
          onChange={(e)=>setCorreo(e.target.value)} 
          className="w-full p-2 border rounded" 
          required 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={contraseña} 
          onChange={(e)=>setContraseña(e.target.value)} 
          className="w-full p-2 border rounded" 
          required 
        />
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
        {/* Enlace a registro }
        <p className="text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
} */

import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //const res = await axios.post("http://localhost:3000/api/auth/login", { correo, contraseña });
      
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { correo, contraseña });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("usuario", JSON.stringify(res.data.usuario));
      // Redirigir según rol
      res.data.usuario.rol === "admin" ? navigate("/admin") : navigate("/usuario");
    } catch (err) {
      alert(err.response?.data?.error || "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md space-y-6">
        <h2 className="text-3xl font-bold text-center text-gray-800">Iniciar Sesión</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              placeholder="Ingresa tu correo" 
              value={correo} 
              onChange={(e)=>setCorreo(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input 
              type="password" 
              placeholder="Ingresa tu contraseña" 
              value={contraseña} 
              onChange={(e)=>setContraseña(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
              required 
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          Entrar
        </button>

        {/* Enlace a registro */}
        <p className="text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
