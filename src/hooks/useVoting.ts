import { useContext } from "react";
import { VotingContext } from "../context/VotingContext";

export const useVoting = () => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error("useVoting debe ser usado dentro de VotingProvider");
  }
  return context;
};
