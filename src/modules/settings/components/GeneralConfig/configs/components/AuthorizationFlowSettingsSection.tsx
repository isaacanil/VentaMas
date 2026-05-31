import { Checkbox, message } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';
import { ROUTES } from '@/router/routes/routesName';

import {
  Container,
  HistoryLink,
  InfoBlock,
  InfoDescription,
  InfoTitle,
  ModuleCard,
  ModuleDescription,
  ModuleHeader,
  ModuleLabel,
  ModulesDescription,
  ModulesGrid,
  ModulesSection,
  ModulesTitle,
  SectionContainer,
  StatusCard,
  StatusContainer,
  StatusDescription,
  StatusHeader,
  StatusIndicator,
  StatusTitle,
  ToggleButton,
  ToggleThumb,
} from './AuthorizationFlowSettingsSection.styles';

type AuthorizationModuleKey = 'invoices' | 'accountsReceivable';

interface AuthorizationModuleDefinition {
  key: AuthorizationModuleKey;
  label: string;
  description: string;
}

interface EnabledModules {
  invoices: boolean;
  accountsReceivable: boolean;
}

interface AuthorizationFlowSettingsSectionProps {
  sectionId?: string;
}

const AVAILABLE_MODULES: AuthorizationModuleDefinition[] = [
  {
    key: 'invoices',
    label: 'Facturacion',
    description:
      'Requiere autorizacion para editar facturas y aplicar descuentos',
  },
  {
    key: 'accountsReceivable',
    label: 'Cuadre de Caja',
    description: 'Requiere autorizacion para apertura y cierre de caja',
  },
];

type AuthorizationSettingsResult =
  | {
      status: 'success';
    }
  | {
      errorMessage: string;
      status: 'error';
    };

const saveAuthorizationFlowEnabled = async ({
  enabled,
  user,
}: {
  enabled: boolean;
  user: ReturnType<typeof selectUser>;
}): Promise<AuthorizationSettingsResult> => {
  try {
    await setBillingSettings(user, { authorizationFlowEnabled: enabled });
    return {
      status: 'success',
    };
  } catch {
    return {
      status: 'error',
      errorMessage: 'Error al guardar la configuracion.',
    };
  }
};

const saveAuthorizationModules = async ({
  modules,
  user,
}: {
  modules: EnabledModules;
  user: ReturnType<typeof selectUser>;
}): Promise<AuthorizationSettingsResult> => {
  try {
    await setBillingSettings(user, {
      enabledAuthorizationModules: {
        ...modules,
        cashRegister: modules.accountsReceivable,
      },
    });
    return {
      status: 'success',
    };
  } catch {
    return {
      status: 'error',
      errorMessage: 'Error al actualizar el modulo.',
    };
  }
};

const AuthorizationFlowSettingsSection = ({
  sectionId = 'authorization-flow-overview',
}: AuthorizationFlowSettingsSectionProps) => {
  const user = useSelector(selectUser);
  const settings = useSelector(SelectSettingCart);
  const authorizationFlowEnabled =
    !!settings?.billing?.authorizationFlowEnabled;

  const rawEnabledModules = settings?.billing?.enabledAuthorizationModules;
  const enabledModules: EnabledModules = {
    invoices: rawEnabledModules?.invoices ?? true,
    accountsReceivable:
      rawEnabledModules?.accountsReceivable ??
      rawEnabledModules?.cashRegister ??
      true,
  };
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleToggle = async (nextValue: boolean) => {
    if (!user?.businessID) {
      messageApi.error(
        'No se pudo actualizar la configuracion de autorizaciones.',
      );
      return;
    }

    setIsUpdating(true);
    if (nextValue) {
      const hasActiveModule = Object.values(enabledModules).some(
        (value) => value === true,
      );
      if (!hasActiveModule) {
        messageApi.warning('Debes activar al menos un modulo de autorizacion.');
        setIsUpdating(false);
        return;
      }
    }

    const result = await saveAuthorizationFlowEnabled({
      enabled: nextValue,
      user,
    });
    setIsUpdating(false);

    if (result.status === 'success') {
      messageApi.success(
        `Flujo de autorizaciones ${nextValue ? 'habilitado' : 'deshabilitado'}`,
      );
      return;
    }

    messageApi.error(result.errorMessage);
  };

  const handleModuleToggle = async (
    moduleKey: AuthorizationModuleKey,
    checked: boolean,
  ) => {
    if (!user?.businessID) {
      messageApi.error('No se pudo actualizar la configuracion.');
      return;
    }

    const newModules = {
      invoices: moduleKey === 'invoices' ? checked : enabledModules.invoices,
      accountsReceivable:
        moduleKey === 'accountsReceivable'
          ? checked
          : enabledModules.accountsReceivable,
    };
    const hasActiveModule = Object.values(newModules).some(
      (value) => value === true,
    );

    if (!hasActiveModule) {
      messageApi.warning('Debes mantener al menos un modulo activo.');
      return;
    }

    setIsUpdating(true);
    const result = await saveAuthorizationModules({
      modules: newModules,
      user,
    });
    setIsUpdating(false);

    if (result.status === 'success') {
      messageApi.success('Modulo actualizado correctamente');
      return;
    }

    messageApi.error(result.errorMessage);
  };

  const handleGoToAuthorizations = () => {
    navigate(ROUTES.AUTHORIZATIONS_TERM.AUTHORIZATIONS_LIST);
  };

  return (
    <Container id={sectionId} data-config-section={sectionId}>
      {contextHolder}
      <SectionContainer>
        <InfoBlock>
          <InfoTitle>Habilitar Flujo de Autorizaciones</InfoTitle>
          <InfoDescription>
            Activa o desactiva la autorizacion con PIN para acciones protegidas
          </InfoDescription>
        </InfoBlock>
        <ToggleButton
          type="button"
          role="switch"
          aria-checked={authorizationFlowEnabled}
          aria-label="Alternar flujo de autorizaciones"
          onClick={() => handleToggle(!authorizationFlowEnabled)}
          disabled={isUpdating}
          $checked={authorizationFlowEnabled}
        >
          <ToggleThumb $checked={authorizationFlowEnabled} />
        </ToggleButton>
      </SectionContainer>

      {authorizationFlowEnabled && (
        <ModulesSection>
          <ModulesTitle>Modulos de Autorizacion Activos</ModulesTitle>
          <ModulesDescription>
            Selecciona que areas del sistema requieren autorizacion con PIN. Al
            menos un modulo debe estar activo.
          </ModulesDescription>
          <ModulesGrid>
            {AVAILABLE_MODULES.map((module) => (
              <ModuleCard key={module.key}>
                <ModuleHeader>
                  <Checkbox
                    checked={enabledModules[module.key] !== false}
                    onChange={(event) =>
                      handleModuleToggle(module.key, event.target.checked)
                    }
                    disabled={isUpdating}
                  >
                    <ModuleLabel>{module.label}</ModuleLabel>
                  </Checkbox>
                </ModuleHeader>
                <ModuleDescription>{module.description}</ModuleDescription>
              </ModuleCard>
            ))}
          </ModulesGrid>
        </ModulesSection>
      )}

      <StatusContainer>
        {authorizationFlowEnabled ? (
          <StatusCard $type="info">
            <StatusHeader>
              <StatusIndicator $type="info" />
              <StatusTitle $type="info">Autorizaciones activadas</StatusTitle>
            </StatusHeader>
            <StatusDescription>
              Los cajeros deberan solicitar la aprobacion de un supervisor con
              PIN para acciones protegidas.
              {enabledModules.invoices && ' Activo en Facturacion.'}
              {enabledModules.accountsReceivable &&
                ' Activo en Cuadre de Caja.'}
            </StatusDescription>
            <HistoryLink type="button" onClick={handleGoToAuthorizations}>
              Ver historial de autorizaciones
            </HistoryLink>
          </StatusCard>
        ) : (
          <StatusCard $type="warning">
            <StatusHeader>
              <StatusIndicator $type="warning" />
              <StatusTitle $type="warning">
                Autorizaciones desactivadas
              </StatusTitle>
            </StatusHeader>
            <StatusDescription>
              El flujo de autorizaciones esta deshabilitado. Las acciones
              protegidas se podran realizar sin solicitar PIN.
            </StatusDescription>
          </StatusCard>
        )}
      </StatusContainer>
    </Container>
  );
};

export default AuthorizationFlowSettingsSection;
