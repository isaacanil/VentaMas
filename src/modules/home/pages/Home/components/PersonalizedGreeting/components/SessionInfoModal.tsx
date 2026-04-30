import { AlertDialog, Avatar, Button, Chip, Menu, Modal, Separator } from '@heroui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faGear,
  faRightToBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { getRoleLabelById } from '@/abilities/roles';
import { logout } from '@/features/auth/userSlice';
import { fbSignOut } from '@/firebase/Auth/fbAuthV2/fbSignOut';
import ROUTES_PATH from '@/router/routes/routesName';
import { hasBillingAccountManageAccess } from '@/utils/access/accountLevelCapabilities';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';

import type { JSX } from 'react';

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

interface SessionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const SessionInfoModal = ({
  isOpen,
  onClose,
  user,
  business,
}: SessionInfoModalProps): JSX.Element => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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

  const handleOpenSubscriptionCenter = () => {
    if (!canAccessSubscriptionManagement) return;
    onClose();
    navigate(ROUTES_PATH.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE);
  };

  const handleOpenSettings = () => {
    onClose();
    navigate(ROUTES_PATH.SETTING_TERM.SETTINGS);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fbSignOut();
    } finally {
      dispatch(logout());
      onClose();
      navigate('/login', { replace: true });
    }
  };

  const canManagePayments =
    canAccessSubscriptionManagement &&
    hasBillingAccountManageAccess({
      user,
      business,
    });

  return (
    <>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(nextIsOpen) => {
          if (!nextIsOpen) onClose();
        }}
        variant="opaque"
        className="z-[400]"
      >
        <Modal.Container placement="center" size="xs">
          <Modal.Dialog aria-label="Opciones de sesión">
            <Modal.Header className="flex-row items-center gap-3">
              <Avatar size="md" variant="soft">
                <Avatar.Fallback>{initial}</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Modal.Heading className="truncate text-sm">
                  {displayName}
                </Modal.Heading>
                <div className="mt-0.5">
                  <Chip size="sm" variant="soft" color="accent">
                    <Chip.Label>{role}</Chip.Label>
                  </Chip>
                </div>
              </div>
            </Modal.Header>

            <Modal.Body>
              <Separator />

              <Menu aria-label="Opciones de sesión">
                <Menu.Section>
                  <Menu.Item
                    id="settings"
                    textValue="Configuración"
                    onAction={handleOpenSettings}
                  >
                    <FontAwesomeIcon icon={faGear} fixedWidth />
                    Configuración
                  </Menu.Item>

                  {canManagePayments && (
                    <Menu.Item
                      id="subscription"
                      textValue="Gestionar suscripción"
                      onAction={handleOpenSubscriptionCenter}
                    >
                      <FontAwesomeIcon icon={faCreditCard} fixedWidth />
                      Gestionar suscripción
                    </Menu.Item>
                  )}
                </Menu.Section>
              </Menu>
              <Separator />
              <Menu aria-label="Opciones de sesión">
                <Menu.Section>
                  <Menu.Item
                    id="logout"
                    variant="danger"
                    textValue="Cerrar sesión"
                    onAction={() => setConfirmOpen(true)}
                  >
                    <FontAwesomeIcon icon={faRightToBracket} fixedWidth />
                    Cerrar sesión
                  </Menu.Item>
                </Menu.Section>
              </Menu>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <AlertDialog.Backdrop
        isOpen={confirmOpen}
        onOpenChange={(open) => {
          if (!isLoggingOut) setConfirmOpen(open);
        }}
        className="z-[500]"
        isDismissable={!isLoggingOut}
        isKeyboardDismissDisabled={isLoggingOut}
      >
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[380px]">
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>¿Cerrar sesión?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                Tu sesión actual será cerrada y tendrás que iniciar sesión
                nuevamente.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary" isDisabled={isLoggingOut}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                isDisabled={isLoggingOut}
                onPress={handleLogout}
              >
                {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </>
  );
};
