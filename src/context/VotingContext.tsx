import { createContext } from "react";
import type { VotingContextType } from "../types";

export const VotingContext = createContext<VotingContextType | null>(null);
