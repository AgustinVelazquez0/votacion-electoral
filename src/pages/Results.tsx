import React, { useState, useEffect } from "react";
import { useVoting } from "../hooks/useVoting";
import type { VotingResults, CandidateResult } from "../types";
import styles from "../styles/Results.module.css";

// Mock data para resultados (después vendrá del backend)
const mockResults: VotingResults = {
  totalVotes: 15420,
  participationRate: 68.5,
  isFinalized: false,
  lastUpdated: new Date(),
  candidateResults: [
    {
      candidateId: 1,
      candidateName: "María González",
      votes: 6840,
      percentage: 44.36,
    },
    {
      candidateId: 2,
      candidateName: "Carlos Rodríguez",
      votes: 5580,
      percentage: 36.18,
    },
    {
      candidateId: 3,
      candidateName: "Ana Martínez",
      votes: 3000,
      percentage: 19.46,
    },
  ],
};

const Results: React.FC = () => {
  const [results, setResults] = useState<VotingResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { currentSession, user } = useVoting();

  // Simular carga de resultados
  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResults(mockResults);
      setIsLoading(false);
    };
    loadResults();
  }, []);

  // Auto-refresh cada 30 segundos si está habilitado
  useEffect(() => {
    if (!autoRefresh || !results || results.isFinalized) return;

    const interval = setInterval(() => {
      setResults((prev) => {
        if (!prev) return prev;
        const increment = Math.floor(Math.random() * 50) + 10;
        const newTotal = prev.totalVotes + increment;

        return {
          ...prev,
          totalVotes: newTotal,
          candidateResults: prev.candidateResults.map((candidate) => {
            const newVotes =
              candidate.votes + Math.floor(Math.random() * 20) + 5;
            return {
              ...candidate,
              votes: newVotes,
              percentage: (newVotes / newTotal) * 100,
            };
          }),
        };
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, results]);

  const formatNumber = (num: number): string => num.toLocaleString("es-ES");

  const getWinner = (): CandidateResult | null => {
    if (!results || !results.isFinalized) return null;
    return results.candidateResults.reduce((prev, current) =>
      prev.percentage > current.percentage ? prev : current
    );
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando resultados...</p>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `,
          }}
        />
      </div>
    );
  }

  if (!results) {
    return (
      <div className={styles.noResults}>
        <h2>No hay resultados disponibles</h2>
        <p>Los resultados no están disponibles en este momento.</p>
      </div>
    );
  }

  const winner = getWinner();
  const sortedResults = [...results.candidateResults].sort(
    (a, b) => b.percentage - a.percentage
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Resultados de la Votación</h1>
        <p className={styles.subtitle}>
          {currentSession?.title || "Proceso Electoral"}
        </p>
      </div>

      <div className={styles.statusContainer}>
        <div className={styles.statusBox}>
          <h3 className={styles.totalVotes}>
            {formatNumber(results.totalVotes)}
          </h3>
          <p style={{ color: "#666", margin: "0.5rem 0 0 0" }}>Votos totales</p>
        </div>
        <div className={styles.statusBox}>
          <h3 className={styles.participationRate}>
            {results.participationRate.toFixed(1)}%
          </h3>
          <p style={{ color: "#666", margin: "0.5rem 0 0 0" }}>Participación</p>
        </div>
        <div className={styles.statusBox}>
          <h3
            className={styles.statusText}
            style={{ color: results.isFinalized ? "#dc3545" : "#ffc107" }}
          >
            {results.isFinalized ? "FINALIZADOS" : "EN PROGRESO"}
          </h3>
          <p style={{ color: "#666", margin: "0.5rem 0 0 0" }}>Estado</p>
        </div>
      </div>

      {winner && results.isFinalized && (
        <div className={styles.winnerBox}>
          <h2 className={styles.winnerTitle}>🏆 Candidato Ganador</h2>
          <h3 className={styles.winnerName}>{winner.candidateName}</h3>
          <p className={styles.winnerVotes}>
            {formatNumber(winner.votes)} votos ({winner.percentage.toFixed(2)}%)
          </p>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.controlsLeft}>
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            disabled={results.isFinalized}
          />
          <label htmlFor="autoRefresh" className={styles.controlsLabel}>
            Actualizar automáticamente cada 30s
          </label>
        </div>
        <p className={styles.lastUpdate}>
          Última actualización: {new Date().toLocaleTimeString()}
        </p>
      </div>

      <div className={styles.resultsBox}>
        <h2 className={styles.resultsTitle}>Detalles por Candidato</h2>
        <div className={styles.candidatesList}>
          {sortedResults.map((candidate, index) => {
            const highlight = index === 0 && results.isFinalized;
            const borderColor =
              index === 0 && results.isFinalized ? "#ffc107" : "#e9ecef";

            return (
              <div
                key={candidate.candidateId}
                className={`${styles.candidateCard} ${
                  highlight ? styles.candidateCardHighlight : ""
                }`}
                style={{ borderColor }}
              >
                <div
                  className={styles.positionCircle}
                  style={{
                    backgroundColor:
                      index === 0
                        ? "#ffc107"
                        : index === 1
                        ? "#6c757d"
                        : "#adb5bd",
                  }}
                >
                  {index + 1}
                </div>
                <h3 className={styles.candidateName}>
                  {candidate.candidateName}
                </h3>

                <div className={styles.votesPercentageContainer}>
                  <span className={styles.votes}>
                    {formatNumber(candidate.votes)} votos
                  </span>
                  <span className={styles.percentage}>
                    {candidate.percentage.toFixed(2)}%
                  </span>
                </div>

                <div className={styles.progressBarBackground}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${candidate.percentage}%`,
                      backgroundColor:
                        index === 0
                          ? "#ffc107"
                          : index === 1
                          ? "#6c757d"
                          : "#adb5bd",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className={styles.footerInfo}>
        <p>Usuario actual: {user?.name || "Anónimo"}</p>
      </footer>
    </div>
  );
};

export default Results;
