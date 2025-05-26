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

interface VotingProviderProps {
  children: ReactNode;
}

export function VotingProvider({ children }: VotingProviderProps) {
  const [state, dispatch] = useReducer(votingReducer, initialState);

  // Inicialización de la sesión
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Simular delay de API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 🔧 SOLUCIÓN: Crear una sesión con fechas válidas
        const currentSession = {
          ...mockSession,
          startDate: new Date(), // Fecha actual
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas desde ahora
          isActive: true,
        };

        console.log("📅 Sesión creada:", {
          start: currentSession.startDate,
          end: currentSession.endDate,
          isActive: currentSession.isActive,
        });

        dispatch({ type: "SET_SESSION", payload: currentSession });
      } catch (error) {
        console.error("Error cargando sesión:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Error al cargar la sesión de votación",
        });
      }
    };

    initializeSession();
  }, []);

  // Restaurar usuario desde localStorage
  useEffect(() => {
    const restoreUser = () => {
      try {
        const storedUser = localStorage.getItem("authUser");
        console.log(
          "🔍 Verificando localStorage para usuario:",
          storedUser ? "encontrado" : "no encontrado"
        );

        if (storedUser) {
          const parsedUser: AuthUser = JSON.parse(storedUser);
          console.log("📋 Usuario parseado:", parsedUser);

          if (parsedUser && parsedUser.dni && parsedUser.isAuthenticated) {
            dispatch({ type: "LOGIN_SUCCESS", payload: parsedUser });
            console.log("✅ Usuario restaurado exitosamente:", parsedUser.name);
          } else {
            console.log("❌ Usuario inválido, limpiando localStorage");
            localStorage.removeItem("authUser");
          }
        }
      } catch (e) {
        console.error("❌ Error al parsear usuario desde localStorage:", e);
        localStorage.removeItem("authUser");
      } finally {
        dispatch({ type: "INITIALIZE_COMPLETE" });
      }
    };

    restoreUser();
  }, []);

  // Validación de credenciales
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

      // Simular llamada backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Verificar usuarios existentes
      const users: AuthUser[] = JSON.parse(
        localStorage.getItem("users") || "[]"
      );

      const dniExists = users.some((user) => user.dni === dni);

      if (dniExists) {
        dispatch({
          type: "SET_ERROR",
          payload: "El DNI ya está registrado",
        });
        return false;
      }

      // Crear nuevo usuario
      const newUser: AuthUser = {
        id: parseInt(dni.slice(-4)),
        name,
        email,
        dni,
        isAuthenticated: true,
        role: "voter",
        lastLogin: new Date(),
      };

      // Guardar usuario
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      try {
        localStorage.setItem("authUser", JSON.stringify(newUser));
      } catch (e) {
        console.error("Error al guardar en localStorage:", e);
      }

      dispatch({ type: "REGISTER_SUCCESS", payload: newUser });
      console.log("✅ Registro exitoso:", newUser);

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

      // Simular llamada al backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Recuperar usuarios
      const users: AuthUser[] = JSON.parse(
        localStorage.getItem("users") || "[]"
      );

      const foundUser = users.find((user) => user.dni === dni);

      if (!foundUser) {
        dispatch({
          type: "SET_ERROR",
          payload:
            "Credenciales incorrectas o usuario no autorizado para votar",
        });
        dispatch({ type: "INCREMENT_ATTEMPTS" });
        return false;
      }

      // Actualizar usuario
      foundUser.lastLogin = new Date();
      foundUser.isAuthenticated = true;

      const updatedUsers = users.map((u) => (u.dni === dni ? foundUser : u));
      localStorage.setItem("users", JSON.stringify(updatedUsers));

      try {
        localStorage.setItem("authUser", JSON.stringify(foundUser));
      } catch (e) {
        console.error("Error al guardar en localStorage:", e);
        dispatch({
          type: "SET_ERROR",
          payload: "Error al guardar la sesión. Intente nuevamente.",
        });
        return false;
      }

      dispatch({ type: "LOGIN_SUCCESS", payload: foundUser });

      // Simular si ya votó (30%)
      const hasAlreadyVoted = Math.random() < 0.3;
      if (hasAlreadyVoted) {
        dispatch({ type: "VOTE_SUCCESS" });
      }

      console.log("✅ Login exitoso:", foundUser);
      return true;
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
    try {
      localStorage.removeItem("authUser");
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
      // Simular procesamiento de voto
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

  // 🔧 SOLUCIÓN: Verificar expiración de sesión solo cuando todo esté inicializado
  useEffect(() => {
    // Solo ejecutar si tenemos usuario, sesión y está inicializado
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
        localStorage.removeItem("authUser");
      } else {
        console.log(
          "✅ Sesión válida, tiempo restante:",
          Math.round((sessionEnd.getTime() - now.getTime()) / 1000 / 60),
          "minutos"
        );
      }
    };

    // Verificar inmediatamente
    checkSessionExpiry();

    // Verificar cada 5 minutos (más eficiente)
    const interval = setInterval(checkSessionExpiry, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [state.user, state.currentSession, state.isInitialized]);

  // 🔧 Verificar integridad del localStorage - Solo cuando pierde el foco
  useEffect(() => {
    if (!state.user || !state.isInitialized) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Cuando la app recupera el foco
        const storedUser = localStorage.getItem("authUser");
        if (!storedUser && state.user) {
          console.log("⚠️ Usuario perdido en localStorage, cerrando sesión");
          dispatch({ type: "LOGOUT" });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.user, state.isInitialized]);

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
