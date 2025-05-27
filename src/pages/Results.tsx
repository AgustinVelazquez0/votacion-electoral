import React, { useState, useEffect, useCallback } from "react";
import { useVoting } from "../hooks/useVoting";
import type { VotingResults, CandidateResult } from "../types";
import styles from "../styles/Results.module.css";

const Results: React.FC = () => {
  const [results, setResults] = useState<VotingResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Usar el hook useVoting para obtener candidatos y sesión
  const { currentSession, user, candidates } = useVoting();

  const loadResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/voting/results");
      if (!response.ok) {
        throw new Error("Error al obtener los resultados");
      }
      const data: VotingResults = await response.json();
      console.log("=== DEBUGGING API RESPONSE ===");
      console.log(
        "Datos completos del backend:",
        JSON.stringify(data, null, 2)
      );
      console.log("candidateResults:", data.candidateResults);
      console.log(
        "candidateResults es array?",
        Array.isArray(data.candidateResults)
      );
      console.log("candidateResults length:", data.candidateResults?.length);
      console.log("Tipo de candidateResults:", typeof data.candidateResults);
      console.log("=== FIN DEBUG ===");

      // Si no hay candidateResults en la respuesta, crear una estructura vacía usando los candidatos del hook
      if (
        !data.candidateResults ||
        !Array.isArray(data.candidateResults) ||
        data.candidateResults.length === 0
      ) {
        console.log(
          "No hay candidateResults válidos en la respuesta, usando candidatos del hook"
        );
        const emptyCandidateResults: CandidateResult[] = candidates.map(
          (candidate) => ({
            candidateId: candidate.id,
            candidateName: candidate.name,
            votes: 0,
            percentage: 0,
          })
        );

        setResults({
          ...data,
          candidateResults: emptyCandidateResults,
          totalVotes: data.totalVotes || 0,
          participationRate: data.participationRate || 0,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        });
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error("Error cargando resultados:", error);

      // En caso de error, crear una estructura con los candidatos disponibles
      if (candidates.length > 0) {
        const emptyCandidateResults: CandidateResult[] = candidates.map(
          (candidate) => ({
            candidateId: candidate.id,
            candidateName: candidate.name,
            votes: 0,
            percentage: 0,
          })
        );

        setResults({
          totalVotes: 0,
          candidateResults: emptyCandidateResults,
          isFinalized: false,
          participationRate: 0,
          lastUpdated: new Date(),
        });
      } else {
        setResults(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [candidates]);

  useEffect(() => {
    // Solo cargar resultados si tenemos candidatos disponibles
    if (candidates.length > 0) {
      loadResults();
    } else {
      setIsLoading(false);
    }
  }, [candidates, loadResults]);

  // Auto-refresh cada 30 segundos si está habilitado
  useEffect(() => {
    if (!autoRefresh || !results || results.isFinalized) return;

    const interval = setInterval(() => {
      loadResults();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, results, loadResults]);

  const formatNumber = (num: number): string => num.toLocaleString("es-ES");

  const estimatedTotalVoters = 1000;

  const calculateParticipationRate = (totalVotes: number): string => {
    return totalVotes > 0
      ? ((totalVotes / estimatedTotalVoters) * 100).toFixed(1)
      : "0";
  };

  const getWinner = (): CandidateResult | null => {
    if (
      !results ||
      !results.isFinalized ||
      !Array.isArray(results.candidateResults)
    )
      return null;
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
        {candidates.length > 0 && (
          <div>
            <p>Candidatos disponibles: {candidates.length}</p>
            <ul>
              {candidates.map((candidate) => (
                <li key={candidate.id}>{candidate.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const winner = getWinner();

  // Validamos que candidateResults sea un array antes de usar sort
  const sortedResults = Array.isArray(results.candidateResults)
    ? [...results.candidateResults].sort((a, b) => b.percentage - a.percentage)
    : [];

  console.log("candidates from hook:", candidates);
  console.log("sortedResults:", sortedResults);
  console.log("sortedResults length:", sortedResults.length);

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
            {calculateParticipationRate(results.totalVotes)}%
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

      {/* Mostrar información de debug */}
      <div
        style={{
          background: "#f8f9fa",
          padding: "1rem",
          margin: "1rem 0",
          borderRadius: "4px",
        }}
      >
        <p>
          <strong>Debug Info:</strong>
        </p>
        <p>Candidatos desde hook: {candidates.length}</p>
        <p>Candidatos en resultados: {sortedResults.length}</p>
        <p>Total de votos: {results.totalVotes}</p>
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
        <h2 className={styles.resultsTitle}>
          Detalles por Candidato ({sortedResults.length})
        </h2>

        {sortedResults.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
            <p>No hay datos de candidatos disponibles</p>
            <p>Candidatos en el sistema: {candidates.length}</p>
            {candidates.length > 0 && (
              <div>
                <p>Lista de candidatos:</p>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {candidates.map((candidate) => (
                    <li key={candidate.id} style={{ margin: "0.5rem 0" }}>
                      {candidate.name} ({candidate.party})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
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
        )}
      </div>

      <footer className={styles.footerInfo}>
        <p>Usuario actual: {user?.name || "Anónimo"}</p>
      </footer>
    </div>
  );
};

export default Results;
