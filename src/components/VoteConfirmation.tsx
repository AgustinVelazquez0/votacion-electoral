import React, { useState, useEffect } from "react";
import type { Candidate } from "../types";
import styles from "../styles/VoteConfirmation.module.css";

interface Props {
  candidate: Candidate;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const VoteConfirmation: React.FC<Props> = ({
  candidate,
  onConfirm,
  onCancel,
  isProcessing,
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [canConfirm, setCanConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 segundos para confirmar

  const requiredText = "CONFIRMO MI VOTO";

  useEffect(() => {
    setCanConfirm(confirmationText.toUpperCase() === requiredText);
  }, [confirmationText]);

  // Countdown para auto-cancelar
  useEffect(() => {
    if (isProcessing) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isProcessing, onCancel]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isProcessing) {
      onCancel();
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="confirmation-title">🗳️ Confirmar Voto</h2>
          {!isProcessing && <div className={styles.timer}>⏰ {timeLeft}s</div>}
        </div>

        {/* Candidate Info */}
        <div className={styles.candidateInfo}>
          <div className={styles.candidateHeader}>
            <div className={styles.avatar}>
              {candidate.image ? (
                <img src={candidate.image} alt={candidate.name} />
              ) : (
                "👤"
              )}
            </div>
            <div className={styles.candidateDetails}>
              <h3>{candidate.name}</h3>
              {candidate.party && (
                <p className={styles.party}>{candidate.party}</p>
              )}
            </div>
          </div>

          <div className={styles.description}>
            <p>{candidate.description}</p>
          </div>

          {candidate.proposals && candidate.proposals.length > 0 && (
            <div className={styles.proposals}>
              <h4>📋 Propuestas principales:</h4>
              <ul>
                {candidate.proposals.slice(0, 3).map((proposal, index) => (
                  <li key={index}>{proposal}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className={styles.warning}>
          <div className={styles.warningIcon}>⚠️</div>
          <div className={styles.warningText}>
            <h4>¡ATENCIÓN!</h4>
            <p>
              Una vez confirmado, su voto será{" "}
              <strong>definitivo e irreversible</strong>. No podrá modificar su
              elección.
            </p>
          </div>
        </div>

        {/* Confirmation Input */}
        {!isProcessing && (
          <div className={styles.confirmationInput}>
            <label htmlFor="confirmation-text">
              Para confirmar, escriba: <strong>"{requiredText}"</strong>
            </label>
            <input
              id="confirmation-text"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Escriba la frase de confirmación..."
              className={canConfirm ? styles.inputValid : styles.inputInvalid}
              autoComplete="off"
              autoFocus
            />
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className={styles.processing}>
            <div className={styles.spinner}></div>
            <h3>Procesando su voto...</h3>
            <p>Por favor, no cierre esta ventana</p>
            <div className={styles.processingSteps}>
              <div className={styles.step}>✅ Verificando identidad</div>
              <div className={styles.step}>🔄 Encriptando voto</div>
              <div className={styles.step}>📤 Enviando al servidor</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className={styles.cancelButton}
          >
            {isProcessing ? "Procesando..." : "❌ Cancelar"}
          </button>

          <button
            onClick={onConfirm}
            disabled={!canConfirm || isProcessing}
            className={`${styles.confirmButton} ${
              canConfirm && !isProcessing ? styles.confirmButtonActive : ""
            }`}
          >
            {isProcessing ? (
              <>
                <span className={styles.buttonSpinner}></span>
                Confirmando...
              </>
            ) : (
              "✅ CONFIRMAR VOTO"
            )}
          </button>
        </div>

        {/* Legal Info */}
        <div className={styles.legalInfo}>
          <small>
            🔒 Su voto es secreto y será protegido bajo las leyes electorales
            vigentes. Esta acción quedará registrada con fines de auditoría.
          </small>
        </div>
      </div>
    </div>
  );
};

export default VoteConfirmation;
