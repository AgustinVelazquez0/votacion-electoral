export interface Candidate {
  id: number;
  name: string;
  description: string;
  image?: string;
  party?: string;
  proposals: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  dni: string;
  hasVoted: boolean;
  votedAt?: Date;
  isEligible: boolean;
}

export interface Vote {
  id: number;
  userId: number;
  candidateId: number;
  timestamp: Date;
  sessionId: string;
  // Agregar hash para verificación de integridad
  hash?: string;
}

export interface VotingSession {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  candidates: Candidate[];
  totalVotes: number;
  results?: VotingResults;
  // Agregar configuraciones adicionales
  allowMultipleVotes?: boolean;
  requiresVerification?: boolean;
}

export interface VotingResults {
  totalVotes: number;
  candidateResults: CandidateResult[];
  participationRate: number;
  isFinalized: boolean;
  // Agregar metadatos de auditoría
  lastUpdated: Date;
  verificationHash?: string;
}

export interface CandidateResult {
  candidateId: number;
  candidateName: string;
  votes: number;
  percentage: number;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  dni: string;
  isAuthenticated: boolean;
  role: "voter" | "admin" | "observer";
  // Agregar permisos específicos
  permissions?: string[];
  lastLogin?: Date;
  hasVoted?: boolean;
}

// Nuevos tipos para registro
export interface RegisterData {
  name: string;
  email: string;
  dni: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  address: string;
  phone: string;
}

export interface VotingContextType {
  // Estado
  user: AuthUser | null;
  currentSession: VotingSession | null;
  candidates: Candidate[];
  votes: Vote[];
  selectedCandidateId: number | null;
  isVotingInProgress: boolean;
  isLoading: boolean;
  votingAttempts: number;
  sessionExpired: boolean;
  error: string | null;

  // Métodos de autenticación
  login: (dni: string, password: string) => Promise<boolean>;
  register: (userData: {
    name: string;
    email: string;
    dni: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => void;

  // Métodos de votación
  selectCandidate: (candidateId: number) => void;
  submitVote: (candidateId: number) => Promise<boolean>;
  hasUserVoted: (userId?: string) => boolean;

  // Métodos de utilidad
  clearError: () => void;

  // Métodos para resultados (futuro)
  getResults?: () => Promise<VotingResults | null>;
  refreshSession?: () => Promise<void>;
}

export type VotingStatus = "not-started" | "active" | "ended" | "paused";

export interface VotingError {
  code: string;
  message: string;
  details?: string;
  timestamp?: Date;
}

// NUEVOS TIPOS PARA MEJORAR LA SEGURIDAD
export interface VotingSecurityConfig {
  maxVotingTime: number; // en segundos
  requireTwoFactorAuth: boolean;
  allowVoteChange: boolean;
  encryptVotes: boolean;
}

export interface AuditLog {
  id: string;
  userId: number;
  action: string;
  timestamp: Date;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// TIPOS PARA VALIDACIÓN
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface VoterEligibility {
  isEligible: boolean;
  reasons: string[];
  verificationStatus: "pending" | "verified" | "rejected";
}

export interface RegisterValidationResult extends ValidationResult {
  field?: keyof RegisterData;
}
