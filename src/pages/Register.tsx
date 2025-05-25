import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVoting } from "../hooks/useVoting";
import styles from "../styles/Register.module.css";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dni: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isLoading, error, clearError, user } = useVoting();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      navigate("/vote");
    }
  }, [user, navigate]);

  // Limpiar errores cuando el componente se monta
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validar nombre
    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    } else if (formData.name.trim().length < 2) {
      errors.name = "El nombre debe tener al menos 2 caracteres";
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "El formato del email no es válido";
    }

    // Validar DNI
    if (!formData.dni.trim()) {
      errors.dni = "El DNI es requerido";
    } else if (!/^\d+$/.test(formData.dni)) {
      errors.dni = "El DNI solo debe contener números";
    } else if (formData.dni.length < 7 || formData.dni.length > 10) {
      errors.dni = "El DNI debe tener entre 7 y 10 dígitos";
    }

    // Validar contraseña
    if (!formData.password) {
      errors.password = "La contraseña es requerida";
    } else if (formData.password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        "La contraseña debe contener al menos una mayúscula, una minúscula y un número";
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Debe confirmar la contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error específico del campo cuando el usuario empiece a escribir
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Limpiar error general
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await register({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        dni: formData.dni.trim(),
        password: formData.password,
      });

      if (success) {
        // El navegador será redirigido automáticamente por el useEffect
        // cuando el usuario se actualice en el contexto
      }
    } catch (err) {
      console.error("Error durante el registro:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h1>Registro de Votante</h1>
          <p>Crea tu cuenta para participar en las elecciones</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Campo Nombre */}
          <div className={styles.inputGroup}>
            <label htmlFor="name">Nombre Completo</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ingresa tu nombre completo"
              disabled={isLoading || isSubmitting}
              className={formErrors.name ? styles.inputError : ""}
            />
            {formErrors.name && (
              <span className={styles.errorText}>{formErrors.name}</span>
            )}
          </div>

          {/* Campo Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="ejemplo@correo.com"
              disabled={isLoading || isSubmitting}
              className={formErrors.email ? styles.inputError : ""}
            />
            {formErrors.email && (
              <span className={styles.errorText}>{formErrors.email}</span>
            )}
          </div>

          {/* Campo DNI */}
          <div className={styles.inputGroup}>
            <label htmlFor="dni">DNI</label>
            <input
              type="text"
              id="dni"
              name="dni"
              value={formData.dni}
              onChange={handleInputChange}
              placeholder="12345678"
              disabled={isLoading || isSubmitting}
              className={formErrors.dni ? styles.inputError : ""}
            />
            {formErrors.dni && (
              <span className={styles.errorText}>{formErrors.dni}</span>
            )}
          </div>

          {/* Campo Contraseña */}
          <div className={styles.inputGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Mínimo 8 caracteres"
              disabled={isLoading || isSubmitting}
              className={formErrors.password ? styles.inputError : ""}
            />
            {formErrors.password && (
              <span className={styles.errorText}>{formErrors.password}</span>
            )}
          </div>

          {/* Campo Confirmar Contraseña */}
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Repite tu contraseña"
              disabled={isLoading || isSubmitting}
              className={formErrors.confirmPassword ? styles.inputError : ""}
            />
            {formErrors.confirmPassword && (
              <span className={styles.errorText}>
                {formErrors.confirmPassword}
              </span>
            )}
          </div>

          {/* Error general */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Botón de submit */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? "Registrando..." : "Crear Cuenta"}
          </button>
        </form>

        {/* Link para ir al login */}
        <div className={styles.footer}>
          <p>
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className={styles.link}>
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
