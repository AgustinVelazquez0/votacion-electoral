import React from "react";
import type { Candidate } from "../types";
import styles from "../styles/CandidateCard.module.css";

interface Props {
  candidate: Candidate;
  selected: boolean;
  onSelect: (id: number) => void;
  disabled?: boolean;
}

const CandidateCard: React.FC<Props> = ({
  candidate,
  selected,
  onSelect,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onSelect(candidate.id);
    }
  };

  const cardClass = [
    styles.card,
    selected ? styles.cardSelected : "",
    disabled ? styles.cardDisabled : "",
  ].join(" ");

  return (
    <div onClick={handleClick} className={cardClass}>
      {selected && <div className={styles.selectedIndicator}>✓</div>}

      <div className={styles.avatar}>
        {candidate.image ? (
          <img src={candidate.image} alt={candidate.name} />
        ) : (
          "👤"
        )}
      </div>

      <div className={styles.info}>
        <h3 className={styles.name}>{candidate.name}</h3>
        {candidate.party && <p className={styles.party}>{candidate.party}</p>}
        <p className={styles.description}>{candidate.description}</p>
      </div>

      {candidate.proposals && candidate.proposals.length > 0 && (
        <div
          className={`${styles.proposals} ${
            selected ? styles.proposalsSelected : ""
          }`}
        >
          <h4>Propuestas principales:</h4>
          <ul>
            {candidate.proposals.slice(0, 3).map((proposal, index) => (
              <li key={index}>{proposal}</li>
            ))}
            {candidate.proposals.length > 3 && (
              <li className={styles.more}>
                Y {candidate.proposals.length - 3} propuesta
                {candidate.proposals.length - 3 > 1 ? "s" : ""} más...
              </li>
            )}
          </ul>
        </div>
      )}

      <div className={styles.footer}>
        <span
          className={`${styles.footerText} ${
            selected ? styles.footerTextSelected : ""
          }`}
        >
          {selected ? "CANDIDATO SELECCIONADO" : "Click para seleccionar"}
        </span>
      </div>
    </div>
  );
};

export default CandidateCard;
