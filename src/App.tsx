import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { VotingProvider } from "./providers/VotingProvider";
import { useVoting } from "./hooks/useVoting";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Vote from "./pages/Vote";
import Results from "./pages/Results";
import Home from "./pages/Home";
import styles from "./App.module.css";

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useVoting();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente para rutas públicas (redirect si ya está logueado)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useVoting();

  if (user) {
    return <Navigate to="/vote" replace />;
  }

  return <>{children}</>;
};

// Componente principal de rutas
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Ruta pública - Login */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Ruta pública - Register */}
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vote"
        element={
          <ProtectedRoute>
            <Layout>
              <Vote />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <Layout>
              <Results />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// Componente principal de la aplicación
function App() {
  return (
    <VotingProvider>
      <BrowserRouter>
        <div className={`${styles.App} ${styles.centerVertically}`}>
          <AppRoutes />
        </div>
      </BrowserRouter>
    </VotingProvider>
  );
}

export default App;
