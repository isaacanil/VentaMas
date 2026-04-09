import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';

interface User {
  id: string;
  name: string;
  businessID: string;
  businessId?: string;
  activeBusinessId?: string;
  role: string;
  activeRole?: string;
  businessHasOwners?: boolean;
  [key: string]: any;
}

interface UserState {
  user: User | null;
  /** true once the initial session check has resolved (success or failure). */
  authReady: boolean;
  originalBusinessId: string | null;
  originalRole: string | null;
}

interface UserRootState {
  user: UserState;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const hasPlatformDevRole = (payload: Record<string, any>): boolean => {
  const root = asRecord(payload);
  const rootPlatformRoles = asRecord(root.platformRoles);
  return rootPlatformRoles.dev === true;
};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const parsed = toCleanString(value);
    if (parsed) return parsed;
  }
  return null;
};

// Keep internal "current user" shape consistent across the app.
// Many callers still read legacy/new aliases (uid/id, businessID/businessId/activeBusinessId, role/activeRole).
const normalizeUserAliases = <T extends Record<string, any>>(payload: T): T => {
  const root = asRecord(payload);
  const devBusinessSimulation = asRecord(root.devBusinessSimulation);
  const simulationOverrideBusinessId =
    devBusinessSimulation.isActive === true
      ? resolveString(devBusinessSimulation.overrideBusinessId)
      : null;

  const uid = resolveString(root.uid, root.id, root.userId, root.user_id);
  const businessId = resolveString(
    simulationOverrideBusinessId,
    root.activeBusinessId,
    root.activeBusinessID,
    root.businessID,
    root.businessId,
    asRecord(root.business).id,
    asRecord(root.business).businessID,
    asRecord(root.business).businessId,
  );

  const role = resolveString(root.activeRole, root.role);

  const nextPayload: Record<string, unknown> = { ...payload };

  if (uid) {
    // Ensure both are always available (some modules use uid, others use id).
    nextPayload.uid = uid;
    nextPayload.id = uid;
  }
  if (businessId) {
    // Ensure business aliases are aligned (switchToBusiness previously only mutated businessID).
    nextPayload.businessID = businessId;
    nextPayload.businessId = businessId;
    nextPayload.activeBusinessId = businessId;
  }
  if (role) {
    // Keep role and activeRole aligned unless some flow explicitly controls them.
    nextPayload.role = role;
    nextPayload.activeRole = role;
  }

  return nextPayload as T;
};

const normalizeRoleFields = <T extends Record<string, any>>(payload: T): T => {
  if (hasPlatformDevRole(payload)) {
    return {
      ...payload,
      role: 'dev',
      activeRole: 'dev',
    } as T;
  }

  const normalizedRole = normalizeRoleId(payload?.activeRole ?? payload?.role);
  if (!normalizedRole) return payload;

  const nextPayload = { ...payload, role: normalizedRole };
  nextPayload.activeRole = normalizedRole;
  return nextPayload as T;
};

const initialState: UserState = {
  user: null,
  authReady: false,
  originalBusinessId: null, // Para guardar el businessID original como referencia
  originalRole: null, // Para guardar el role original como referencia
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state: UserState, action: PayloadAction<Partial<User>>) => {
      const prevUid =
        (state.user &&
          (typeof (state.user as any).uid === 'string'
            ? ((state.user as any).uid as string)
            : typeof (state.user as any).id === 'string'
              ? ((state.user as any).id as string)
              : null)) ||
        null;
      const nextUid =
        (typeof (action.payload as any)?.uid === 'string'
          ? ((action.payload as any).uid as string)
          : typeof (action.payload as any)?.id === 'string'
            ? ((action.payload as any).id as string)
            : null) || null;

      const isAccountSwitch = !!prevUid && !!nextUid && prevUid !== nextUid;

      // Important: if we are switching accounts without a full app reload, do NOT
      // merge with the previous user (it can leak roles/flags between users).
      const baseUser = isAccountSwitch ? {} : state.user ? { ...state.user } : {};
      const mergedPayload = normalizeRoleFields(
        normalizeUserAliases({
          ...baseUser,
          ...action.payload,
        }),
      );

      if (isAccountSwitch) {
        state.originalBusinessId = null;
        state.originalRole = null;
      }

      state.user = mergedPayload as User;
      state.authReady = true;
    },
    setAuthReady: (state: UserState) => {
      state.authReady = true;
    },
    addUserData: (state: UserState, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = normalizeRoleFields(
          normalizeUserAliases({
            ...state.user,
            ...action.payload,
          }),
        );
      }
    },
    logout: (state: UserState) => {
      state.user = null;
      // authReady stays true — we know there's no user (not "haven't checked yet")
      state.originalBusinessId = null; // Limpiar también la referencia original
      state.originalRole = null; // Limpiar también el role original
    },
    // Cambiar temporalmente de negocio (modo invitado)
    switchToBusiness: (state: UserState, action: PayloadAction<string>) => {
      if (state.user) {
        const nextBusinessId = toCleanString(action.payload);
        if (!nextBusinessId) return;
        const simulationOriginalBusinessId = toCleanString(
          asRecord((state.user as Record<string, unknown>).devBusinessSimulation)
            .originalBusinessId,
        );
        // Guardar el negocio original (canónico primero) si no está guardado
        if (!state.originalBusinessId) {
          state.originalBusinessId =
            simulationOriginalBusinessId ||
            state.user.activeBusinessId ||
            state.user.businessId ||
            state.user.businessID;
        }
        state.user.activeBusinessId = nextBusinessId;
        // Mantener aliases por compatibilidad temporal
        state.user.businessID = nextBusinessId;
        state.user.businessId = nextBusinessId;
      }
    }, // Volver al negocio original
    returnToOriginalBusiness: (state: UserState) => {
      if (!state.user) return;
      const simulationOriginalBusinessId = toCleanString(
        asRecord((state.user as Record<string, unknown>).devBusinessSimulation)
          .originalBusinessId,
      );
      const targetBusinessId =
        state.originalBusinessId || simulationOriginalBusinessId;
      if (targetBusinessId) {
        state.user.activeBusinessId = targetBusinessId;
        state.user.businessID = targetBusinessId;
        state.user.businessId = targetBusinessId;
        state.originalBusinessId = null;
      }
    },
    // Cambiar temporalmente de role (modo desarrollador)
    switchToRole: (state: UserState, action: PayloadAction<string>) => {
      if (state.user) {
        const nextRole = normalizeRoleId(action.payload) || action.payload;
        // Guardar el role original si no está guardado
        if (!state.originalRole) {
          state.originalRole = state.user.activeRole ?? state.user.role;
        }
        // Cambiar el role actual (mantener aliases alineados)
        state.user.role = nextRole;
        state.user.activeRole = nextRole;
      }
    },
    // Volver al role original
    returnToOriginalRole: (state: UserState) => {
      if (state.user && state.originalRole) {
        state.user.role = state.originalRole;
        state.user.activeRole = state.originalRole;
        state.originalRole = null;
      }
    },
  },
});

export const {
  login,
  logout,
  addUserData,
  setAuthReady,
  switchToBusiness,
  returnToOriginalBusiness,
  switchToRole,
  returnToOriginalRole,
} = userSlice.actions;

export const selectUser = (state: UserRootState) => state.user.user;

export const selectAuthReady = (state: UserRootState) => state.user.authReady;

const resolveDevSimulation = (state: UserRootState) =>
  asRecord(asRecord(state.user.user).devBusinessSimulation);

// Selector para saber si estamos en modo temporal
export const selectIsTemporaryMode = (state: UserRootState) =>
  !!state.user.originalBusinessId || resolveDevSimulation(state).isActive === true;

// Selector para obtener el businessID original del usuario
export const selectOriginalBusinessId = (state: UserRootState) =>
  state.user.originalBusinessId ||
  toCleanString(resolveDevSimulation(state).originalBusinessId);

// Selector para saber si estamos en modo temporal de role
export const selectIsTemporaryRoleMode = (state: UserRootState) =>
  !!state.user.originalRole;

// Selector para obtener el role original del usuario
export const selectOriginalRole = (state: UserRootState) =>
  state.user.originalRole;

export default userSlice.reducer;
