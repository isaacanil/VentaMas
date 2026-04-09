import { doc, getDoc } from 'firebase/firestore';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Form, type InputRef } from 'antd';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { fbValidateUser } from '@/firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser';
import { fbValidateUserPin } from '@/firebase/authorization/pinAuth';
import { db } from '@/firebase/firebaseconfig';
import { normalizeCurrentUserContext } from '@/utils/auth-adapter';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';
import { CORE_PRIVILEGED_ROLES } from '@/utils/roles/roleGroups';

import type {
  AuthorizedUser,
  PasswordFormValues,
  PinAuthorizationModalProps,
} from '../types';

type PinValidationResult = Awaited<ReturnType<typeof fbValidateUserPin>>;
type PinAuthRootState = Parameters<typeof selectUser>[0];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const INACTIVE_MEMBERSHIP_STATUSES = new Set([
  'inactive',
  'suspended',
  'revoked',
]);

const isActiveMembership = (raw: unknown): boolean => {
  if (!isRecord(raw)) return true;
  const status = toCleanString(raw.status)?.toLowerCase() || null;
  if (status && INACTIVE_MEMBERSHIP_STATUSES.has(status)) return false;
  if (typeof raw.active === 'boolean') return raw.active;
  return true;
};

const resolvePreferredBusinessId = (user: unknown): string | null => {
  if (!isRecord(user)) return null;
  return (
    toCleanString(user.activeBusinessId) ||
    toCleanString(user.businessID) ||
    toCleanString(user.businessId) ||
    null
  );
};

const resolveAuthorizedUser = (
  user: unknown,
  options: {
    uidFallback?: string | null;
    preferredBusinessId?: string | null;
  } = {},
): AuthorizedUser | null => {
  if (!isRecord(user)) return null;

  const root = asRecord(user);
  const normalized = normalizeCurrentUserContext(
    {
      ...root,
      id:
        toCleanString(root.id) ||
        toCleanString(root.uid) ||
        toCleanString(options.uidFallback) ||
        undefined,
      uid:
        toCleanString(root.uid) ||
        toCleanString(root.id) ||
        toCleanString(options.uidFallback) ||
        undefined,
    },
    {
      preferredBusinessId: options.preferredBusinessId || undefined,
    },
  );

  const uid =
    normalized.uid ||
    toCleanString(root.uid) ||
    toCleanString(root.id) ||
    toCleanString(options.uidFallback);
  const role =
    normalizeRoleId(normalized.activeRole) ||
    normalizeRoleId(root.activeRole) ||
    normalizeRoleId(root.role);
  const businessId =
    normalized.activeBusinessId ||
    toCleanString(root.activeBusinessId) ||
    toCleanString(root.businessID) ||
    toCleanString(root.businessId);
  const displayName =
    normalized.displayName ||
    toCleanString(root.displayName) ||
    toCleanString(root.realName) ||
    toCleanString(root.name) ||
    null;
  const name =
    toCleanString(root.name) || toCleanString(root.displayName) || null;

  return {
    uid,
    id: uid,
    name: name || undefined,
    displayName: displayName || undefined,
    role: role || undefined,
    activeRole: role || undefined,
    businessID: businessId || undefined,
    businessId: businessId || undefined,
    activeBusinessId: businessId || undefined,
    email: toCleanString(root.email) || undefined,
    accessControl: normalized.accessControl,
    memberships: normalized.memberships,
  };
};

interface UsePinAuthorizationControllerArgs {
  allowPasswordFallback: boolean;
  allowedRoles: string[];
  isOpen: boolean;
  module: string;
  onAuthorized: PinAuthorizationModalProps['onAuthorized'];
  setIsOpen: PinAuthorizationModalProps['setIsOpen'];
}

interface UsePinAuthorizationControllerResult {
  error: string;
  form: ReturnType<typeof Form.useForm<PasswordFormValues>>[0];
  handleCancel: () => void;
  handleSubmit: () => Promise<void>;
  loading: boolean;
  passwordInputRef: RefObject<InputRef | null>;
  pinValue: string;
  setPinValue: (value: string) => void;
  toggleMode: () => void;
  usePassword: boolean;
  usernameInputRef: RefObject<InputRef | null>;
}

export const usePinAuthorizationController = ({
  allowPasswordFallback,
  allowedRoles,
  isOpen,
  module,
  onAuthorized,
  setIsOpen,
}: UsePinAuthorizationControllerArgs): UsePinAuthorizationControllerResult => {
  const currentUser = useSelector((state: PinAuthRootState) =>
    selectUser(state),
  );
  const [form] = Form.useForm<PasswordFormValues>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [pinValue, setPinValue] = useState('');

  const usernameInputRef = useRef<InputRef | null>(null);
  const passwordInputRef = useRef<InputRef | null>(null);
  const preferredBusinessId = useMemo(
    () => resolvePreferredBusinessId(currentUser),
    [currentUser],
  );
  const normalizedAllowedRoles = useMemo(
    () =>
      Array.from(
        new Set(
          allowedRoles
            .map((role) => normalizeRoleId(role))
            .filter((role): role is string => Boolean(role)),
        ),
      ),
    [allowedRoles],
  );

  const isUserRoleAllowed = (user: AuthorizedUser | null): boolean => {
    const role = normalizeRoleId(user?.activeRole || user?.role);
    return Boolean(role && normalizedAllowedRoles.includes(role));
  };

  const resetAndClose = () => {
    form.resetFields();
    setError('');
    setLoading(false);
    setUsePassword(false);
    setPinValue('');
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen || loading) return;

    const timer = setTimeout(() => {
      if (usePassword) {
        usernameInputRef.current?.focus?.();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, loading, usePassword]);

  const fetchUserById = async (uid: string): Promise<AuthorizedUser> => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error('No se encontro el usuario.');
    const data = (snap.data() as Record<string, unknown> | undefined) ?? {};

    const baseUser = resolveAuthorizedUser(
      {
        ...data,
        id: uid,
        uid,
      },
      {
        uidFallback: uid,
        preferredBusinessId,
      },
    );

    const businessIdToCheck =
      preferredBusinessId || baseUser?.activeBusinessId || null;

    let membershipRole: string | null = null;
    if (businessIdToCheck) {
      const membershipRef = doc(db, 'businesses', businessIdToCheck, 'members', uid);
      const membershipSnap = await getDoc(membershipRef);
      if (membershipSnap.exists()) {
        const membershipData = membershipSnap.data();
        if (isActiveMembership(membershipData)) {
          membershipRole =
            normalizeRoleId(membershipData?.activeRole) ||
            normalizeRoleId(membershipData?.role) ||
            null;
        }
      }
    }

    const normalizedUser = resolveAuthorizedUser(
      {
        ...data,
        id: uid,
        uid,
        ...(businessIdToCheck
          ? {
              activeBusinessId: businessIdToCheck,
              businessID: businessIdToCheck,
              businessId: businessIdToCheck,
            }
          : {}),
        ...(membershipRole
          ? { activeRole: membershipRole, role: membershipRole }
          : {}),
        ...(membershipRole && businessIdToCheck
          ? {
              accessControl: [
                {
                  businessId: businessIdToCheck,
                  role: membershipRole,
                  status: 'active',
                },
              ],
              memberships: [
                {
                  businessId: businessIdToCheck,
                  role: membershipRole,
                  status: 'active',
                  uid,
                },
              ],
            }
          : {}),
      },
      {
        uidFallback: uid,
        preferredBusinessId: businessIdToCheck || preferredBusinessId,
      },
    );

    if (!normalizedUser) throw new Error('No se encontro el usuario.');
    return normalizedUser;
  };

  const handleSubmitPin = async (pin: string) => {
    setLoading(true);
    setError('');

    if (!pin || pin.length !== 6) {
      setError('El PIN debe tener 6 digitos');
      setLoading(false);
      return;
    }

    let result: PinValidationResult;
    try {
      result = await fbValidateUserPin(currentUser, {
        pin,
        module,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error validando PIN';
      setError(message);
      setLoading(false);
      return;
    }

    if (!result.valid) {
      setError(result.reason || 'PIN invalido');
      setLoading(false);
      return;
    }

    const authorizedUser = resolveAuthorizedUser(result.user, {
      preferredBusinessId,
    });
    if (!authorizedUser || !isUserRoleAllowed(authorizedUser)) {
      setError('Usuario no autorizado para aprobar esta accion.');
      setLoading(false);
      return;
    }

    await onAuthorized(authorizedUser);
    resetAndClose();
  };

  const handleSubmitPassword = async ({
    username,
    password,
  }: PasswordFormValues) => {
    setLoading(true);
    setError('');

    let userData: Awaited<ReturnType<typeof fbValidateUser>>['userData'];
    let response: Awaited<ReturnType<typeof fbValidateUser>>['response'];
    try {
      ({ userData, response } = await fbValidateUser({
        name: username,
        password,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error obteniendo datos del usuario.';
      setError(message);
      setLoading(false);
      return;
    }

    if (response?.error) {
      setError(response.error);
      setLoading(false);
      return;
    }

    const uid = typeof userData?.uid === 'string' ? userData.uid : null;
    if (!uid) {
      setError('No se encontro el usuario.');
      setLoading(false);
      return;
    }

    const approver = await fetchUserById(uid);
    if (!isUserRoleAllowed(approver)) {
      setError('Usuario no autorizado para aprobar esta accion.');
      setLoading(false);
      return;
    }

    await onAuthorized(approver);
    resetAndClose();
  };

  const handleSubmit = async () => {
    if (loading) return;
    try {
      if (usePassword) {
        const values = await form.validateFields(['username', 'password']);
        await handleSubmitPassword(values);
        return;
      }

      await handleSubmitPin(pinValue);
    } catch {
      // Validation errors should keep the modal open.
    }
  };

  const handleCancel = () => {
    resetAndClose();
  };

  const toggleMode = () => {
    if (!allowPasswordFallback || loading) return;

    setUsePassword(!usePassword);
    setError('');
    setPinValue('');
    form.resetFields(['password', 'username']);

    setTimeout(() => {
      if (!usePassword) {
        usernameInputRef.current?.focus?.();
      }
    }, 0);
  };

  return {
    error,
    form,
    handleCancel,
    handleSubmit,
    loading,
    passwordInputRef,
    pinValue,
    setPinValue,
    toggleMode,
    usePassword,
    usernameInputRef,
  };
};
