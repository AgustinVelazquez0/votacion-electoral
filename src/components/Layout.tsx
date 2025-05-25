import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useVoting } from "../hooks/useVoting";
import styles from "../styles/Layout.module.css";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { user, logout } = useVoting();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={styles.layoutContainer}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <h1 className={styles.brand}>🗳️ VotoSeguro</h1>
          </div>

          <nav className={styles.nav}>
            <Link
              to="/"
              className={`${styles.link} ${
                isActive("/") ? styles.activeLink : ""
              }`}
            >
              Inicio
            </Link>
            <Link
              to="/vote"
              className={`${styles.link} ${
                isActive("/vote") ? styles.activeLink : ""
              }`}
            >
              Votar
            </Link>
            <Link
              to="/results"
              className={`${styles.link} ${
                isActive("/results") ? styles.activeLink : ""
              }`}
            >
              Resultados
            </Link>
          </nav>

          <div className={styles.userSection}>
            <div className={styles.user}>
              <span className="font-medium">Bienvenido, {user?.name}</span>
              <br />
              <span className={styles.userId}>ID: {user?.id}</span>
            </div>
            <button onClick={handleLogout} className={styles.logout}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className={styles.mobileNav}>
          <div>
            <Link
              to="/"
              className={`${styles.link} ${
                isActive("/") ? styles.activeLink : ""
              }`}
            >
              Inicio
            </Link>
            <Link
              to="/vote"
              className={`${styles.link} ${
                isActive("/vote") ? styles.activeLink : ""
              }`}
            >
              Votar
            </Link>
            <Link
              to="/results"
              className={`${styles.link} ${
                isActive("/results") ? styles.activeLink : ""
              }`}
            >
              Resultados
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div>{children}</div>
      </main>

      <footer className={styles.footer}>
        <div>
          <div>
            <p>© 2025 VotoSeguro - Sistema de Votación Seguro y Transparente</p>
            <p className={styles.footerNote}>
              Desarrollado para garantizar procesos democráticos confiables
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
