import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useVoting } from "../hooks/useVoting";
import styles from "../styles/Home.module.css";

function Home() {
  const { user, candidates, hasUserVoted } = useVoting();
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const userHasVoted = hasUserVoted(user?.id?.toString());

  const estimatedTotalVoters = 1000;
  const participationRate =
    totalVotes > 0
      ? ((totalVotes / estimatedTotalVoters) * 100).toFixed(1)
      : "0";

  // Método para formatear números igual que en Results.tsx
  const formatNumber = (num: number): string => num.toLocaleString("es-ES");

  // Cargar estadísticas reales desde el backend
  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch("http://localhost:3000/api/voting/results");
      if (response.ok) {
        const data = await response.json();
        setTotalVotes(data.totalVotes || 0);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      setTotalVotes(0);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className={styles.container}>
      {/* Bienvenida */}
      <div className={styles.card}>
        <div className={styles.centerText}>
          <h1 className={styles.title}>Bienvenido al Sistema de Votación</h1>
          <p className={styles.subtitle}>
            Hola <span className={styles.userName}>{user?.name}</span>,
            participa en el proceso democrático de manera segura y transparente.
          </p>

          {/* Estado de votación del usuario */}
          <div className={styles.voteStatus}>
            {userHasVoted ? (
              <div className={`${styles.alert} ${styles.alertSuccess}`}>
                <div className={styles.flexCenter}>
                  <svg
                    className={styles.icon}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className={styles.fontMedium}>
                    ¡Ya has emitido tu voto!
                  </span>
                </div>
                <p className={styles.textSmall}>
                  Gracias por participar en el proceso democrático.
                </p>
              </div>
            ) : (
              <div className={`${styles.alert} ${styles.alertWarning}`}>
                <div className={styles.flexCenter}>
                  <svg
                    className={styles.icon}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className={styles.fontMedium}>Aún no has votado</span>
                </div>
                <p className={styles.textSmall}>
                  Tu participación es importante para la democracia.
                </p>
              </div>
            )}
          </div>

          {/* Botón principal de acción */}
          {!userHasVoted && (
            <div className={styles.marginBottom}>
              <Link to="/vote" className={styles.voteButton}>
                🗳️ Emitir mi Voto
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className={styles.gridStats}>
        <div className={styles.statCard}>
          <div className={styles.statNumberBlue}>
            {formatNumber(candidates.length)}
          </div>
          <div className={styles.statLabel}>Candidatos</div>
          <div className={styles.statDesc}>Registrados en el sistema</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statNumberGreen}>
            {isLoadingStats ? "..." : formatNumber(totalVotes)}
          </div>
          <div className={styles.statLabel}>Votos Emitidos</div>
          <div className={styles.statDesc}>Total de participantes</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statNumberPurple}>{participationRate}%</div>
          <div className={styles.statLabel}>Participación</div>
          <div className={styles.statDesc}>Del padrón electoral</div>
        </div>
      </div>

      {/* Información del proceso */}
      <div className={styles.infoCard}>
        <h2 className={styles.infoTitle}>Información del Proceso Electoral</h2>

        <div className={styles.gridInfo}>
          <div>
            <h3 className={styles.infoSubtitle}>¿Cómo funciona?</h3>
            <ul className={styles.list}>
              {[
                "Revisa los candidatos disponibles",
                "Selecciona tu candidato preferido",
                "Confirma tu voto de manera segura",
                "Consulta los resultados en tiempo real",
              ].map((step, i) => (
                <li key={i} className={styles.listItem}>
                  <span className={styles.listNumber}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={styles.infoSubtitle}>
              Características de Seguridad
            </h3>
            <ul className={styles.list}>
              {[
                "Voto único por usuario",
                "Encriptación de datos",
                "Auditabilidad completa",
                "Transparencia total",
              ].map((feature, i) => (
                <li key={i} className={styles.listItemIcon}>
                  <svg
                    className={styles.iconGreen}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className={styles.infoCard}>
        <h2 className={styles.infoTitle}>Acciones Disponibles</h2>
        <div className={styles.gridActions}>
          <Link to="/vote" className={styles.actionLink}>
            <div className={styles.iconCircleBlue}>
              <svg
                className={styles.icon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div>
              <h3 className={styles.actionTitle}>Emitir Voto</h3>
              <p className={styles.actionDesc}>Participa en la votación</p>
            </div>
          </Link>

          <Link to="/results" className={styles.actionLink}>
            <div className={styles.iconCircleGreen}>
              <svg
                className={styles.icon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 className={styles.actionTitle}>Ver Resultados</h3>
              <p className={styles.actionDesc}>
                Consulta resultados en tiempo real
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
