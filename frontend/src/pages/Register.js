/*import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombres: "", apellidos: "", telefono: "", correo: "", contraseña: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {

      //localhost
      //await axios.post("http://localhost:3000/api/auth/register", form);

      //Zona
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, form);


      alert("Registrado correctamente. Ahora inicia sesión.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Error en el registro");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center">Registro</h2>
        {["nombres","apellidos","telefono","correo","contraseña"].map((field) => (
          <input
            key={field}
            type={field==="contraseña"?"password":"text"}
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={form[field]}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        ))}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Registrarse
        </button>
        {/* Enlace a login }
        <p className="text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
} */

import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombres: "", apellidos: "", telefono: "", correo: "", contraseña: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //localhost
      //await axios.post("http://localhost:3000/api/auth/register", form);

      //Zona
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, form);

      alert("Registrado correctamente. Ahora inicia sesión.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Error en el registro");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md space-y-6">
        <h2 className="text-3xl font-bold text-center text-gray-800">Registro</h2>
        
        <div className="space-y-4">
          {["nombres", "apellidos", "telefono", "correo", "contraseña"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === "contraseña" ? "password" : "text"}
                name={field}
                placeholder={`Ingresa tu ${field}`}
                value={form[field]}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          ))}
        </div>

        <button 
          type="submit" 
          className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          Registrarse
        </button>

        {/* Enlace a login */}
        <p className="text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
