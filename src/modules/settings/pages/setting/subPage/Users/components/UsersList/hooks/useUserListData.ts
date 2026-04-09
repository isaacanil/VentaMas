import { onValue, ref } from 'firebase/database';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useReducer, useRef } from 'react';

import { db, realtimeDB } from '@/firebase/firebaseconfig';
import { fbGetUsers } from '@/firebase/users/fbGetUsers';

import type {
  BusinessUserRecord,
  PresenceConnection,
  PresenceMap,
  PresenceStatus,
} from '../types';
import {
  resolveBusinessOwnerCandidates,
  toCleanString,
  toMillis,
} from '../utils/userList';

interface UserListDataState {
  businessOwnerCandidates: string[];
  loadedUsersBusinessId: string | null;
  presenceMap: PresenceMap;
  users: BusinessUserRecord[];
}

type UserListDataAction =
  | { type: 'businessOwnerCandidatesChanged'; candidates: string[] }
  | { type: 'presenceMerged'; updates: Record<string, PresenceStatus> }
  | { type: 'usersLoaded'; businessId: string }
  | { type: 'usersReceived'; users: BusinessUserRecord[] };

const EMPTY_USERS: BusinessUserRecord[] = [];
const EMPTY_PRESENCE: PresenceMap = {};
const EMPTY_OWNER_CANDIDATES: string[] = [];

const initialState: UserListDataState = {
  businessOwnerCandidates: [],
  loadedUsersBusinessId: null,
  presenceMap: {},
  users: [],
};

const userListDataReducer = (
  state: UserListDataState,
  action: UserListDataAction,
): UserListDataState => {
  switch (action.type) {
    case 'businessOwnerCandidatesChanged':
      return {
        ...state,
        businessOwnerCandidates: action.candidates,
      };
    case 'usersReceived':
      return {
        ...state,
        users: action.users,
      };
    case 'usersLoaded':
      return {
        ...state,
        loadedUsersBusinessId: action.businessId,
      };
    case 'presenceMerged': {
      if (Object.keys(action.updates).length === 0) {
        return state;
      }

      let changed = false;
      const nextPresence: PresenceMap = { ...state.presenceMap };

      Object.entries(action.updates).forEach(([uid, incoming]) => {
        const previous = state.presenceMap[uid];
        const normalizedIncoming =
          incoming.state === 'online' && previous?.state === 'online'
            ? {
                state: 'online',
                lastUpdated: previous.lastUpdated,
              }
            : incoming;

        if (
          previous?.state === normalizedIncoming.state &&
          previous?.lastUpdated === normalizedIncoming.lastUpdated
        ) {
          return;
        }

        nextPresence[uid] = normalizedIncoming;
        changed = true;
      });

      if (!changed) {
        return state;
      }

      return {
        ...state,
        presenceMap: nextPresence,
      };
    }
    default:
      return state;
  }
};

export const useUserListData = (activeBusinessId: string | null) => {
  const [state, dispatch] = useReducer(userListDataReducer, initialState);

  useEffect(() => {
    if (!activeBusinessId) return undefined;

    const businessRef = doc(db, 'businesses', activeBusinessId);
    const unsubscribe = onSnapshot(
      businessRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          dispatch({
            type: 'businessOwnerCandidatesChanged',
            candidates: EMPTY_OWNER_CANDIDATES,
          });
          return;
        }

        dispatch({
          type: 'businessOwnerCandidatesChanged',
          candidates: resolveBusinessOwnerCandidates(snapshot.data()),
        });
      },
      () => {
        dispatch({
          type: 'businessOwnerCandidatesChanged',
          candidates: EMPTY_OWNER_CANDIDATES,
        });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [activeBusinessId]);

  const usersQueryContext = useMemo(
    () =>
      activeBusinessId
        ? {
            businessID: activeBusinessId,
            businessId: activeBusinessId,
          }
        : null,
    [activeBusinessId],
  );

  useEffect(() => {
    if (!usersQueryContext) return undefined;

    const unsubscribe = fbGetUsers(
      usersQueryContext,
      (newUsers: BusinessUserRecord[]) => {
        dispatch({
          type: 'usersReceived',
          users: newUsers,
        });
      },
      null,
      () => {
        dispatch({
          type: 'usersLoaded',
          businessId: usersQueryContext.businessID,
        });
      },
    );

    return () => {
      unsubscribe?.();
    };
  }, [usersQueryContext]);

  const users = activeBusinessId ? state.users : EMPTY_USERS;
  const businessOwnerCandidates = activeBusinessId
    ? state.businessOwnerCandidates
    : EMPTY_OWNER_CANDIDATES;
  const userIds = useMemo(
    () =>
      Array.from(
        new Set(
          users
            .map((record) => {
              const root = record as BusinessUserRecord & {
                uid?: unknown;
                id?: unknown;
              };
              const legacyUser =
                root.user && typeof root.user === 'object' ? root.user : null;

              return (
                toCleanString(root.uid) ||
                toCleanString(root.id) ||
                toCleanString(legacyUser?.uid) ||
                toCleanString(legacyUser?.id)
              );
            })
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [users],
  );

  const pendingPresenceRef = useRef<Record<string, PresenceStatus>>({});
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!realtimeDB?.app?.options?.databaseURL) return undefined;
    if (userIds.length === 0) return undefined;

    const flushPresence = () => {
      const pending = pendingPresenceRef.current;
      pendingPresenceRef.current = {};
      rafIdRef.current = null;

      dispatch({
        type: 'presenceMerged',
        updates: pending,
      });
    };

    const scheduleFlush = () => {
      if (rafIdRef.current == null) {
        rafIdRef.current = requestAnimationFrame(flushPresence);
      }
    };

    const unsubscribes = userIds.map((uid) => {
      const presenceRef = ref(realtimeDB, `presence/${uid}`);
      return onValue(presenceRef, (snapshot) => {
        const value = snapshot?.val() as Record<
          string,
          PresenceConnection
        > | null;
        let stateValue = 'offline';
        let lastUpdated = null;

        if (value && typeof value === 'object') {
          const connections = Object.values(value) as PresenceConnection[];
          const onlineConnection = connections.find(
            (connection) => connection?.state === 'online',
          );
          stateValue = onlineConnection ? 'online' : 'offline';

          const timestamps = connections
            .map((connection) => toMillis(connection?.updatedAt))
            .filter((timestamp): timestamp is number => typeof timestamp === 'number');
          if (timestamps.length) {
            lastUpdated = Math.max(...timestamps);
          }
        }

        pendingPresenceRef.current[uid] = {
          state: stateValue,
          lastUpdated,
        };
        scheduleFlush();
      });
    });

    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      pendingPresenceRef.current = {};
      unsubscribes.forEach((unsubscribe) => {
        try {
          unsubscribe?.();
        } catch {
          /* ignore */
        }
      });
    };
  }, [userIds]);

  const isUsersLoading = useMemo(() => {
    if (!activeBusinessId) return false;
    return state.loadedUsersBusinessId !== activeBusinessId;
  }, [activeBusinessId, state.loadedUsersBusinessId]);

  const presenceMapForUsers = useMemo<Record<string, PresenceStatus>>(() => {
    if (userIds.length === 0) return EMPTY_PRESENCE;

    const allowed = new Set(userIds);
    return Object.fromEntries(
      Object.entries(state.presenceMap).filter(([uid]) => allowed.has(String(uid))),
    );
  }, [state.presenceMap, userIds]);

  return {
    businessOwnerCandidates,
    isUsersLoading,
    presenceMap: state.presenceMap,
    presenceMapForUsers,
    users,
  };
};
