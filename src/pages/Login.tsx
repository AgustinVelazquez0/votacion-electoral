import React, { useState } from "react";
import { type FormEvent } from "react";
import { useVoting } from "../hooks/useVoting";
import styles from "../styles/Login.module.css";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useVoting();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!dni.trim() || !password.trim()) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (dni.length < 7) {
      setError("El DNI debe tener al menos 7 dígitos");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(dni, password);
      if (!success) {
        setError("Credenciales inválidas. Verifique sus datos.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Error del sistema. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDni = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    setDni(numbers);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.title}>
          <h1>Sistema de Votación</h1>
          <p>Ingrese sus credenciales para acceder</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>DNI</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => formatDni(e.target.value)}
              placeholder="Ej: 12345678"
              disabled={isLoading}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              disabled={isLoading}
              className={styles.input}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={isLoading} className={styles.button}>
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

          {/* Nuevo botón de registro */}
          <div className={styles.divider}>
            <span>¿No tienes cuenta?</span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/register")} // Asumiendo que usas React Router
            className={styles.registerButton}
          >
            Crear Nueva Cuenta
          </button>
        </form>

        <div className={styles.testData}>
          <strong>Para pruebas:</strong>
          <br />
          DNI: cualquier número de 7-8 dígitos
          <br />
          Contraseña: mínimo 6 caracteres
        </div>
      </div>
    </div>
  );
};

export default Login;
