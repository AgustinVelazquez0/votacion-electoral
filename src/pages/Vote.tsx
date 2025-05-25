import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVoting } from "../hooks/useVoting";
import CandidateCard from "../components/CandidateCard";
import VoteConfirmation from "../components/VoteConfirmation";
import styles from "../styles/Vote.module.css";

const Vote: React.FC = () => {
  const {
    user,
    currentSession,
    candidates,
    selectedCandidateId,
    isVotingInProgress,
    error,
    selectCandidate,
    submitVote,
    hasUserVoted,
    clearError,
  } = useVoting();

  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [sessionStatus, setSessionStatus] = useState<
    "active" | "expired" | "not-started"
  >("active");

  // Verificar autenticación
  useEffect(() => {
    if (!user?.isAuthenticated) {
      navigate("/login");
      return;
    }

    if (hasUserVoted()) {
      navigate("/results");
      return;
    }
  }, [user, hasUserVoted, navigate]);

  // Calcular tiempo restante
  useEffect(() => {
    if (!currentSession) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(currentSession.endDate);
      const startDate = new Date(currentSession.startDate);

      if (now < startDate) {
        setSessionStatus("not-started");
        const diff = startDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${days}d ${hours}h ${minutes}m para el inicio`);
      } else if (now > endDate) {
        setSessionStatus("expired");
        setTimeRemaining("Votación finalizada");
      } else {
        setSessionStatus("active");
        const diff = endDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${days}d ${hours}h ${minutes}m restantes`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [currentSession]);

  const handleCandidateSelect = (candidateId: number) => {
    clearError();
    selectCandidate(candidateId);
  };

  const handleVoteClick = () => {
    if (!selectedCandidateId) {
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidateId) return;

    const success = await submitVote(selectedCandidateId);

    if (success) {
      setShowConfirmation(false);
      // Pequeño delay para mostrar mensaje de éxito antes de redirigir
      setTimeout(() => {
        navigate("/results");
      }, 1500);
    } else {
      setShowConfirmation(false);
    }
  };

  const handleCancelVote = () => {
    setShowConfirmation(false);
  };

  // Obtener información del candidato seleccionado
  const selectedCandidate = candidates.find(
    (c) => c.id === selectedCandidateId
  );

  if (!user?.isAuthenticated) {
    return <div className={styles.loading}>Verificando autenticación...</div>;
  }

  if (!currentSession) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>No hay sesión de votación activa</h2>
          <p>Por favor, intente más tarde o contacte al administrador.</p>
        </div>
      </div>
    );
  }

  if (sessionStatus === "expired") {
    return (
      <div className={styles.container}>
        <div className={styles.sessionExpired}>
          <h2>🗳️ Votación Finalizada</h2>
          <p>El período de votación ha terminado.</p>
          <button
            onClick={() => navigate("/results")}
            className={styles.resultsButton}
          >
            Ver Resultados
          </button>
        </div>
      </div>
    );
  }

  if (sessionStatus === "not-started") {
    return (
      <div className={styles.container}>
        <div className={styles.notStarted}>
          <h2>🕐 Votación Próximamente</h2>
          <p>La votación aún no ha comenzado.</p>
          <div className={styles.countdown}>
            <strong>⏰ {timeRemaining}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header de la votación */}
      <div className={styles.header}>
        <h1>{currentSession.title}</h1>
        <p className={styles.description}>{currentSession.description}</p>

        <div className={styles.sessionInfo}>
          <div className={styles.timeRemaining}>
            ⏰ <strong>{timeRemaining}</strong>
          </div>
          <div className={styles.voterInfo}>
            👤 {user.name} (DNI: {user.dni})
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button
            onClick={clearError}
            className={styles.closeError}
            aria-label="Cerrar error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Instrucciones */}
      <div className={styles.instructions}>
        <h2>📋 Instrucciones para Votar</h2>
        <ol>
          <li>Revise cuidadosamente las propuestas de cada candidato</li>
          <li>Seleccione UN candidato haciendo clic en su tarjeta</li>
          <li>Confirme su voto - esta acción NO se puede deshacer</li>
          <li>Su voto será registrado de forma segura y anónima</li>
        </ol>
      </div>

      {/* Lista de candidatos */}
      <div className={styles.candidatesSection}>
        <h2>🗳️ Candidatos ({candidates.length})</h2>

        <div className={styles.candidatesGrid}>
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              selected={selectedCandidateId === candidate.id}
              onSelect={handleCandidateSelect}
              disabled={isVotingInProgress}
            />
          ))}
        </div>
      </div>

      {/* Sección de votación */}
      <div className={styles.votingSection}>
        {selectedCandidateId ? (
          <div className={styles.selectedInfo}>
            <h3>✅ Has seleccionado a:</h3>
            <div className={styles.selectedCandidate}>
              <strong>{selectedCandidate?.name}</strong>
              <span>({selectedCandidate?.party})</span>
            </div>

            <button
              onClick={handleVoteClick}
              disabled={isVotingInProgress}
              className={`${styles.voteButton} ${
                isVotingInProgress ? styles.voting : ""
              }`}
            >
              {isVotingInProgress ? (
                <>
                  <span className={styles.spinner}></span>
                  Procesando voto...
                </>
              ) : (
                "🗳️ EMITIR VOTO"
              )}
            </button>

            <p className={styles.warning}>
              ⚠️ <strong>Importante:</strong> Una vez confirmado, su voto no
              podrá ser modificado.
            </p>
          </div>
        ) : (
          <div className={styles.noSelection}>
            <p>👆 Seleccione un candidato para continuar</p>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {showConfirmation && selectedCandidate && (
        <VoteConfirmation
          candidate={selectedCandidate}
          onConfirm={handleConfirmVote}
          onCancel={handleCancelVote}
          isProcessing={isVotingInProgress}
        />
      )}

      {/* Información adicional */}
      <div className={styles.additionalInfo}>
        <details className={styles.helpSection}>
          <summary>❓ ¿Necesita ayuda?</summary>
          <div className={styles.helpContent}>
            <h4>Problemas comunes:</h4>
            <ul>
              <li>
                <strong>No puedo seleccionar un candidato:</strong> Verifique
                que no haya votado ya
              </li>
              <li>
                <strong>Error al votar:</strong> Verifique su conexión a
                internet
              </li>
              <li>
                <strong>Sesión expirada:</strong> Inicie sesión nuevamente
              </li>
            </ul>
            <p>
              <strong>Soporte técnico:</strong> soporte@votacion.gov
            </p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default Vote;
