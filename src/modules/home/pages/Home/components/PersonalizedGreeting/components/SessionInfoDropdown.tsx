import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faGear,
  faRightToBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  VmAlertDialog,
  VmAvatar,
  VmButton,
  VmChip,
  VmDropdown,
  VmSeparator,
} from '@/components/heroui';
import { getRoleLabelById } from '@/abilities/roles';
import { logout } from '@/features/auth/userSlice';
import { fbSignOut } from '@/firebase/Auth/fbAuthV2/fbSignOut';
import ROUTES_PATH from '@/router/routes/routesName';
import { hasBillingAccountManageAccess } from '@/utils/access/accountLevelCapabilities';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';

import { CombinedPill } from './CombinedPill';

import type { JSX, Key } from 'react';

interface UserInfo {
  realName?: string | null;
  username?: string | null;
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  activeRole?: string | null;
  businessID?: string | null;
  businessId?: string | null;
  activeBusinessId?: string | null;
  availableBusinesses?: unknown[];
  accessControl?: unknown[];
  hasMultipleBusinesses?: boolean;
  [key: string]: unknown;
}

interface BusinessInfo {
  name?: string | null;
  [key: string]: unknown;
}

interface SessionInfoDropdownProps {
  userName: string;
  fullName: string;
  user?: UserInfo | null;
  business?: BusinessInfo | null;
}

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveDisplayName = (user?: UserInfo | null): string => {
  return (
    toCleanString(user?.realName) ||
    toCleanString(user?.displayName) ||
    toCleanString(user?.username) ||
    'Usuario'
  );
};

export const SessionInfoDropdown = ({
  userName,
  fullName,
  user,
  business,
}: SessionInfoDropdownProps): JSX.Element => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const canAccessSubscriptionManagement = isFrontendFeatureEnabled(
    'subscriptionManagement',
  );
  const displayName = resolveDisplayName(user);
  const initial = displayName.charAt(0).toUpperCase();
  const rawRole =
    toCleanString(user?.activeRole) ||
    toCleanString(user?.role) ||
    'No definido';
  const role = getRoleLabelById(rawRole);
  const canManagePayments =
    canAccessSubscriptionManagement &&
    hasBillingAccountManageAccess({
      user,
      business,
    });

  const handleOpenSubscriptionCenter = () => {
    if (!canManagePayments) return;
    setIsOpen(false);
    navigate(ROUTES_PATH.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE);
  };

  const handleOpenSettings = () => {
    setIsOpen(false);
    navigate(ROUTES_PATH.SETTING_TERM.SETTINGS);
  };

  const handleOpenLogoutConfirmation = () => {
    setIsOpen(false);
    setConfirmOpen(true);
  };

  const handleMenuAction = (key: Key) => {
    if (key === 'settings') {
      handleOpenSettings();
      return;
    }
    if (key === 'subscription') {
      handleOpenSubscriptionCenter();
      return;
    }
    if (key === 'logout') {
      handleOpenLogoutConfirmation();
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fbSignOut();
    } finally {
      dispatch(logout());
      setConfirmOpen(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <VmDropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <VmDropdown.Trigger
          aria-label={`Opciones de sesión de ${fullName}`}
          className="rounded-full bg-transparent p-0 outline-none"
        >
          <CombinedPill userName={userName} fullName={fullName} />
        </VmDropdown.Trigger>

        <VmDropdown.Popover
          placement="bottom end"
          className="z-[450] w-80 overflow-hidden p-0"
        >
          <div className="flex items-center gap-3 p-3">
            <VmAvatar size="md" variant="soft">
              <VmAvatar.Fallback>{initial}</VmAvatar.Fallback>
            </VmAvatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {displayName}
              </div>
              <div className="mt-1">
                <VmChip size="sm" variant="soft" color="accent">
                  <VmChip.Label>{role}</VmChip.Label>
                </VmChip>
              </div>
            </div>
          </div>
          <VmSeparator />

          <VmDropdown.Menu
            aria-label="Opciones de sesión"
            onAction={handleMenuAction}
            className="p-1"
          >
            <VmDropdown.Section>
              <VmDropdown.Item id="settings" textValue="Configuración">
                <span
                  data-slot="label"
                  className="inline-flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faGear} fixedWidth />
                  Configuración
                </span>
              </VmDropdown.Item>

              {canManagePayments && (
                <VmDropdown.Item
                  id="subscription"
                  textValue="Gestionar suscripción"
                >
                  <span
                    data-slot="label"
                    className="inline-flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCreditCard} fixedWidth />
                    Gestionar suscripción
                  </span>
                </VmDropdown.Item>
              )}
            </VmDropdown.Section>
            <VmSeparator />
            <VmDropdown.Section>
              <VmDropdown.Item
                id="logout"
                variant="danger"
                textValue="Cerrar sesión"
              >
                <span
                  data-slot="label"
                  className="inline-flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faRightToBracket} fixedWidth />
                  Cerrar sesión
                </span>
              </VmDropdown.Item>
            </VmDropdown.Section>
          </VmDropdown.Menu>
        </VmDropdown.Popover>
      </VmDropdown>

      <VmAlertDialog.Backdrop
        isOpen={confirmOpen}
        onOpenChange={(open) => {
          if (!isLoggingOut) setConfirmOpen(open);
        }}
        className="z-[500]"
        isDismissable={!isLoggingOut}
        isKeyboardDismissDisabled={isLoggingOut}
      >
        <VmAlertDialog.Container>
          <VmAlertDialog.Dialog className="sm:max-w-[380px]">
            <VmAlertDialog.Header>
              <VmAlertDialog.Icon status="danger" />
              <VmAlertDialog.Heading>¿Cerrar sesión?</VmAlertDialog.Heading>
            </VmAlertDialog.Header>
            <VmAlertDialog.Body>
              <p>
                Tu sesión actual será cerrada y tendrás que iniciar sesión
                nuevamente.
              </p>
            </VmAlertDialog.Body>
            <VmAlertDialog.Footer>
              <VmButton slot="close" variant="tertiary" isDisabled={isLoggingOut}>
                Cancelar
              </VmButton>
              <VmButton
                variant="danger"
                isDisabled={isLoggingOut}
                onPress={handleLogout}
              >
                {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
              </VmButton>
            </VmAlertDialog.Footer>
          </VmAlertDialog.Dialog>
        </VmAlertDialog.Container>
      </VmAlertDialog.Backdrop>
    </>
  );
};
