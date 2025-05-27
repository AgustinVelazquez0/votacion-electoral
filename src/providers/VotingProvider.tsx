import { useReducer, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type {
  AuthUser,
  VotingSession,
  VotingContextType,
  Vote,
  ValidationResult,
} from "../types";
import { VotingContext } from "../context/VotingContext";

// Configuración de la API
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface CandidateData {
  _id: string;
  name: string;
  party: string;
  image?: string;
  proposals?: string[];
  votes?: number;
}

interface VotingState {
  user: AuthUser | null;
  currentSession: VotingSession | null;
  selectedCandidateId: number | null;
  votingInProgress: boolean;
  error: string | null;
  hasVoted: boolean;
  votes: Vote[];
  isLoading: boolean;
  votingAttempts: number;
  sessionExpired: boolean;
  registeredUsers: AuthUser[];
  isInitialized: boolean;
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
  | { type: "SESSION_EXPIRED" }
  | { type: "INITIALIZE_COMPLETE" };

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
  isInitialized: false,
};

function votingReducer(state: VotingState, action: VotingAction): VotingState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        hasVoted: action.payload.hasVoted || false,
        error: null,
        votingAttempts: 0,
        sessionExpired: false,
        isLoading: false,
      };

    case "REGISTER_SUCCESS":
      return {
        ...state,
        registeredUsers: [...state.registeredUsers, action.payload],
        user: action.payload,
        hasVoted: action.payload.hasVoted || false,
        error: null,
        votingAttempts: 0,
        sessionExpired: false,
        isLoading: false,
      };

    case "LOGOUT":
      return {
        ...initialState,
        currentSession: state.currentSession,
        registeredUsers: state.registeredUsers,
        isInitialized: true,
        isLoading: false,
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
        user: state.user ? { ...state.user, hasVoted: true } : null,
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

    case "INITIALIZE_COMPLETE":
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
      };

    default:
      return state;
  }
}

// Utilidad para manejar errores de la API
const handleApiError = (error: unknown): string => {
  // Type guard to safely check error properties
  if (typeof error === "object" && error !== null && "response" in error) {
    const apiError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
    if (apiError.message === "Network Error") {
      return "Error de conexión. Verifique su conexión a internet.";
    }
    return apiError.message || "Error desconocido del servidor";
  }
  return "Error desconocido del servidor";
};

// Utilidad para realizar peticiones HTTP
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

interface VotingProviderProps {
  children: ReactNode;
}

export function VotingProvider({ children }: VotingProviderProps) {
  const [state, dispatch] = useReducer(votingReducer, initialState);

  // Cargar candidatos y configurar la sesión
  useEffect(() => {
    const initializeSession = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });

        // Obtener candidatos del backend
        const candidatesResponse = await apiRequest("/voting/candidates");

        // Obtener resultados para verificar si hay una elección activa
        const resultsResponse = await apiRequest("/voting/results");

        // Crear sesión basada en la respuesta del backend
        const currentSession: VotingSession = {
          id: resultsResponse.election?._id || "default",
          title: resultsResponse.election?.title || "Elección General",
          description: resultsResponse.election?.description || "", // Add this line
          startDate: resultsResponse.election?.startDate
            ? new Date(resultsResponse.election.startDate)
            : new Date(),
          endDate: resultsResponse.election?.endDate
            ? new Date(resultsResponse.election.endDate)
            : new Date(Date.now() + 24 * 60 * 60 * 1000),
          isActive: resultsResponse.election?.isActive || true,
          candidates: candidatesResponse.map((candidate: CandidateData) => ({
            id: candidate._id,
            name: candidate.name,
            party: candidate.party,
            image: candidate.image || "/placeholder-candidate.jpg",
            proposals: candidate.proposals || [],
            votes: candidate.votes || 0,
          })),
          totalVotes: resultsResponse.totalVotes || 0,
        };

        console.log("📅 Sesión creada desde backend:", {
          candidates: currentSession.candidates.length,
          isActive: currentSession.isActive,
          totalVotes: currentSession.totalVotes,
        });

        dispatch({ type: "SET_SESSION", payload: currentSession });
      } catch (error) {
        console.error("Error cargando sesión:", error);
        dispatch({
          type: "SET_ERROR",
          payload: handleApiError(error),
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initializeSession();
  }, []);

  // Restaurar usuario desde token
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        console.log(
          "🔍 Verificando token:",
          storedToken ? "encontrado" : "no encontrado"
        );

        if (storedToken) {
          // Verificar el estado del usuario con el backend
          const userStatus = await apiRequest("/voting/user-status");

          const restoredUser: AuthUser = {
            id: userStatus._id,
            name: userStatus.name,
            email: userStatus.email,
            dni: userStatus.dni,
            isAuthenticated: true,
            role: "voter",
            lastLogin: new Date(userStatus.updatedAt),
            hasVoted: userStatus.hasVoted,
          };

          dispatch({ type: "LOGIN_SUCCESS", payload: restoredUser });
          console.log("✅ Usuario restaurado exitosamente:", restoredUser.name);
        }
      } catch (error) {
        console.error("❌ Error al restaurar usuario:", error);
        // Token inválido o expirado, limpiar
        localStorage.removeItem("authToken");
      } finally {
        dispatch({ type: "INITIALIZE_COMPLETE" });
      }
    };

    restoreUser();
  }, []);

  // Validación de credenciales (mantenemos la validación del frontend)
  const validateCredentials = useCallback(
    (dni: string, password: string): ValidationResult => {
      const errors: string[] = [];

      if (!dni || dni.length < 7 || dni.length > 10) {
        errors.push("El DNI debe tener entre 7 y 10 dígitos");
      }

      if (!/^\d+$/.test(dni)) {
        errors.push("El DNI solo debe contener números");
      }

      if (!password || password.length < 6) {
        errors.push("La contraseña debe tener al menos 6 caracteres");
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

      // Validar nombre y email
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

      // Llamada al backend
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ dni, password, name, email }),
      });

      // Guardar token
      localStorage.setItem("authToken", response.token);

      // Crear objeto de usuario
      const newUser: AuthUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        dni: response.user.dni,
        isAuthenticated: true,
        role: "voter",
        lastLogin: new Date(),
        hasVoted: response.user.hasVoted,
      };

      dispatch({ type: "REGISTER_SUCCESS", payload: newUser });
      console.log("✅ Registro exitoso:", newUser);

      return true;
    } catch (error) {
      console.error("Error en registro:", error);
      dispatch({
        type: "SET_ERROR",
        payload: handleApiError(error),
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

      // Llamada al backend
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ dni, password }),
      });

      // Guardar token
      localStorage.setItem("authToken", response.token);

      // Crear objeto de usuario
      const loggedUser: AuthUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        dni: response.user.dni,
        isAuthenticated: true,
        role: "voter",
        lastLogin: new Date(),
        hasVoted: response.user.hasVoted,
      };

      dispatch({ type: "LOGIN_SUCCESS", payload: loggedUser });
      console.log("✅ Login exitoso:", loggedUser);
      return true;
    } catch (error) {
      console.error("Error en login:", error);
      dispatch({
        type: "SET_ERROR",
        payload: handleApiError(error),
      });
      dispatch({ type: "INCREMENT_ATTEMPTS" });
      return false;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("authToken");
      dispatch({ type: "LOGOUT" });
      console.log("✅ Logout exitoso");
    } catch (e) {
      console.error("Error durante logout:", e);
    }
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
      // Llamada al backend para votar
      await apiRequest("/voting/vote", {
        method: "POST",
        body: JSON.stringify({ candidateId }),
      });

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
    } catch (error) {
      console.error("Error al votar:", error);
      dispatch({
        type: "VOTE_ERROR",
        payload: handleApiError(error),
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
    if (!state.user || !state.currentSession || !state.isInitialized) {
      return;
    }

    console.log("🔍 Verificando expiración de sesión:", {
      currentTime: new Date(),
      sessionEnd: state.currentSession.endDate,
      isActive: state.currentSession.isActive,
    });

    const checkSessionExpiry = () => {
      const now = new Date();
      const sessionEnd = new Date(state.currentSession!.endDate);

      if (now > sessionEnd || !state.currentSession!.isActive) {
        console.log("⚠️ Sesión expirada o inactiva");
        dispatch({ type: "SESSION_EXPIRED" });
        localStorage.removeItem("authToken");
      } else {
        console.log(
          "✅ Sesión válida, tiempo restante:",
          Math.round((sessionEnd.getTime() - now.getTime()) / 1000 / 60),
          "minutos"
        );
      }
    };

    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [state.user, state.currentSession, state.isInitialized]);

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
