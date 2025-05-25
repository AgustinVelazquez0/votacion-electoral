import { useReducer, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type {
  AuthUser,
  VotingSession,
  VotingContextType,
  Vote,
  ValidationResult,
} from "../types";
import { mockSession } from "../data/mockData";
import { VotingContext } from "../context/VotingContext";

interface VotingState {
  user: AuthUser | null;
  currentSession: VotingSession | null;
  selectedCandidateId: number | null;
  votingInProgress: boolean;
  error: string | null;
  hasVoted: boolean;
  votes: Vote[];
  // Nuevos estados para mejorar UX
  isLoading: boolean;
  votingAttempts: number;
  sessionExpired: boolean;
  registeredUsers: AuthUser[];
}

type VotingAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGIN_SUCCESS"; payload: AuthUser }
  | { type: "REGISTER_SUCCESS"; payload: AuthUser }
  | { type: "LOGOUT" }
  | { type: "SET_SESSION"; payload: VotingSession }
  | { type: "SELECT_CANDIDATE"; payload: number }
  | { type: "CLEAR_SELECTION" }
  | { type: "VOTE_START" }
  | { type: "VOTE_SUCCESS"; payload?: Vote }
  | { type: "VOTE_ERROR"; payload: string }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "INCREMENT_ATTEMPTS" }
  | { type: "RESET_ATTEMPTS" }
  | { type: "SESSION_EXPIRED" };

const initialState: VotingState = {
  user: null,
  currentSession: null,
  selectedCandidateId: null,
  votingInProgress: false,
  error: null,
  hasVoted: false,
  votes: [],
  isLoading: false,
  votingAttempts: 0,
  sessionExpired: false,
  registeredUsers: [],
};

function votingReducer(state: VotingState, action: VotingAction): VotingState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        error: null,
        votingAttempts: 0,
        sessionExpired: false,
      };

    case "REGISTER_SUCCESS":
      return {
        ...state,
        registeredUsers: [...state.registeredUsers, action.payload],
        user: action.payload,
        error: null,
        votingAttempts: 0,
        sessionExpired: false,
      };

    case "LOGOUT":
      return {
        ...initialState,
        currentSession: state.currentSession,
        registeredUsers: state.registeredUsers, // Mantener usuarios registrados
      };

    case "SET_SESSION":
      return {
        ...state,
        currentSession: action.payload,
      };

    case "SELECT_CANDIDATE":
      return {
        ...state,
        selectedCandidateId: action.payload,
        error: null,
      };

    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedCandidateId: null,
      };

    case "VOTE_START":
      return {
        ...state,
        votingInProgress: true,
        error: null,
      };

    case "VOTE_SUCCESS":
      return {
        ...state,
        votingInProgress: false,
        hasVoted: true,
        selectedCandidateId: null,
        votingAttempts: 0,
        votes: action.payload ? [...state.votes, action.payload] : state.votes,
      };

    case "VOTE_ERROR":
      return {
        ...state,
        votingInProgress: false,
        error: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "INCREMENT_ATTEMPTS":
      return {
        ...state,
        votingAttempts: state.votingAttempts + 1,
      };

    case "RESET_ATTEMPTS":
      return {
        ...state,
        votingAttempts: 0,
      };

    case "SESSION_EXPIRED":
      return {
        ...state,
        sessionExpired: true,
        user: null,
        error: "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
      };

    default:
      return state;
  }
}

interface VotingProviderProps {
  children: ReactNode;
}

export function VotingProvider({ children }: VotingProviderProps) {
  const [state, dispatch] = useReducer(votingReducer, initialState);

  // Simulamos la carga inicial de la sesión
  useEffect(() => {
    dispatch({ type: "SET_LOADING", payload: true });

    // Simular carga asíncrona
    const timer = setTimeout(() => {
      dispatch({ type: "SET_SESSION", payload: mockSession });
      dispatch({ type: "SET_LOADING", payload: false });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Validación de credenciales mejorada
  const validateCredentials = useCallback(
    (dni: string, password: string): ValidationResult => {
      const errors: string[] = [];

      if (!dni || dni.length < 7 || dni.length > 10) {
        errors.push("El DNI debe tener entre 7 y 10 dígitos");
      }

      if (!/^\d+$/.test(dni)) {
        errors.push("El DNI solo debe contener números");
      }

      if (!password || password.length < 8) {
        errors.push("La contraseña debe tener al menos 8 caracteres");
      }

      if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.push(
          "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    []
  );

  const register = async (userData: {
    name: string;
    email: string;
    dni: string;
    password: string;
  }): Promise<boolean> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const { dni, password, name, email } = userData;

      // Validar credenciales básicas
      const validation = validateCredentials(dni, password);

      if (!validation.isValid) {
        dispatch({
          type: "SET_ERROR",
          payload: validation.errors.join(". "),
        });
        return false;
      }

      // Validar que el nombre y email no estén vacíos y el email tenga formato básico
      if (!name || name.trim().length < 3) {
        dispatch({
          type: "SET_ERROR",
          payload:
            "El nombre es obligatorio y debe tener al menos 3 caracteres",
        });
        return false;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        dispatch({ type: "SET_ERROR", payload: "Email inválido" });
        return false;
      }

      // Simular llamada backend con delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simular que el dni ya está registrado
      const dniExists = state.registeredUsers.some((user) => user.dni === dni);

      if (dniExists) {
        dispatch({
          type: "SET_ERROR",
          payload: "El DNI ya está registrado",
        });
        return false;
      }

      // Simular registro exitoso
      const newUser: AuthUser = {
        id: parseInt(dni.slice(-4)),
        name,
        email,
        dni,
        isAuthenticated: true,
        role: "voter",
        lastLogin: new Date(),
      };

      dispatch({ type: "REGISTER_SUCCESS", payload: newUser });

      return true;
    } catch (error) {
      console.error("Error en registro:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Error de conexión. Verifique su conexión a internet.",
      });
      return false;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const login = async (dni: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      // Validar credenciales
      const validation = validateCredentials(dni, password);

      if (!validation.isValid) {
        dispatch({
          type: "SET_ERROR",
          payload: validation.errors.join(". "),
        });
        return false;
      }

      // Simular llamada al backend con delay realista
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulamos diferentes escenarios de autenticación
      const loginSuccess = Math.random() > 0.1; // 90% de éxito

      if (loginSuccess) {
        const mockUser: AuthUser = {
          id: parseInt(dni.slice(-4)), // Usar últimos 4 dígitos como ID
          name: "Usuario de Prueba",
          email: `usuario${dni.slice(-3)}@ejemplo.com`,
          dni: dni,
          isAuthenticated: true,
          role: "voter",
          lastLogin: new Date(),
        };

        // Verificar si ya votó (simulado)
        const hasAlreadyVoted = Math.random() < 0.3; // 30% ya votó

        dispatch({ type: "LOGIN_SUCCESS", payload: mockUser });

        if (hasAlreadyVoted) {
          dispatch({ type: "VOTE_SUCCESS" });
        }

        return true;
      } else {
        dispatch({
          type: "SET_ERROR",
          payload:
            "Credenciales incorrectas o usuario no autorizado para votar",
        });
        dispatch({ type: "INCREMENT_ATTEMPTS" });
        return false;
      }
    } catch (error) {
      console.error("Error en login:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Error de conexión. Verifique su conexión a internet.",
      });
      return false;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
  }, []);

  const selectCandidate = useCallback(
    (candidateId: number) => {
      if (state.hasVoted) {
        dispatch({
          type: "SET_ERROR",
          payload: "Ya has emitido tu voto y no puedes cambiarlo",
        });
        return;
      }

      dispatch({ type: "SELECT_CANDIDATE", payload: candidateId });
    },
    [state.hasVoted]
  );

  const submitVote = async (candidateId: number): Promise<boolean> => {
    if (!state.user) {
      dispatch({
        type: "SET_ERROR",
        payload: "Debe iniciar sesión para votar",
      });
      return false;
    }

    if (state.hasVoted) {
      dispatch({
        type: "SET_ERROR",
        payload: "Ya has emitido tu voto en esta elección",
      });
      return false;
    }

    if (!state.currentSession?.isActive) {
      dispatch({
        type: "SET_ERROR",
        payload: "La sesión de votación no está activa",
      });
      return false;
    }

    // Verificar que el candidato existe
    const candidateExists = state.currentSession.candidates.some(
      (candidate) => candidate.id === candidateId
    );

    if (!candidateExists) {
      dispatch({
        type: "SET_ERROR",
        payload: "Candidato no válido",
      });
      return false;
    }

    dispatch({ type: "VOTE_START" });

    try {
      // Simular procesamiento de voto con delay realista
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulamos éxito del 95% del tiempo
      if (Math.random() > 0.05) {
        const newVote: Vote = {
          id: Date.now(),
          userId: state.user.id,
          candidateId,
          timestamp: new Date(),
          sessionId: state.currentSession.id,
          hash: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        dispatch({ type: "VOTE_SUCCESS", payload: newVote });
        console.log(`✅ Voto procesado exitosamente:`, newVote);
        return true;
      } else {
        throw new Error("Error del servidor al procesar el voto");
      }
    } catch (error) {
      console.error("Error al votar:", error);
      dispatch({
        type: "VOTE_ERROR",
        payload:
          "Error al procesar el voto. Por favor, intente nuevamente. Si el problema persiste, contacte al soporte técnico.",
      });
      dispatch({ type: "INCREMENT_ATTEMPTS" });
      return false;
    }
  };

  const hasUserVoted = useCallback(
    (userId?: string): boolean => {
      if (userId && state.user?.id.toString() !== userId) {
        return false;
      }
      return state.hasVoted;
    },
    [state.hasVoted, state.user?.id]
  );

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Verificar expiración de sesión
  useEffect(() => {
    if (state.user && state.currentSession) {
      const checkSessionExpiry = () => {
        const now = new Date();
        if (now > state.currentSession!.endDate) {
          dispatch({ type: "SESSION_EXPIRED" });
        }
      };

      const interval = setInterval(checkSessionExpiry, 60000); // Verificar cada minuto
      return () => clearInterval(interval);
    }
  }, [state.user, state.currentSession]);

  const contextValue: VotingContextType = {
    user: state.user,
    currentSession: state.currentSession,
    candidates: state.currentSession?.candidates || [],
    votes: state.votes,
    selectedCandidateId: state.selectedCandidateId,
    isVotingInProgress: state.votingInProgress,
    error: state.error,
    isLoading: state.isLoading,
    votingAttempts: state.votingAttempts,
    sessionExpired: state.sessionExpired,
    login,
    register,
    logout,
    selectCandidate,
    submitVote,
    hasUserVoted,
    clearError,
  };

  return (
    <VotingContext.Provider value={contextValue}>
      {children}
    </VotingContext.Provider>
  );
}
