import {
  faClockRotateLeft,
  faFlaskVial,
  faLayerGroup,
  faPlus,
  faSliders,
  faWrench,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Dropdown, Spin } from 'antd';
import { useState } from 'react';

import { useDeveloperSubscriptionMaintenanceContext } from './useDeveloperSubscriptionMaintenanceContext';
import { DeveloperSubscriptionPlanCard } from './components/DeveloperSubscriptionPlanCard';
import { DeveloperFieldCatalogModal } from './components/DeveloperFieldCatalogModal';
import {
  EmptyDesc,
  EmptyIcon,
  EmptyState,
  EmptyTitle,
  HeaderActions,
  HeaderText,
  LoadingContainer,
  LoadingText,
  PageContent,
  PageHeader,
  PageTitle,
  PlansGrid,
  TitleIcon,
} from './DeveloperSubscriptionMaintenancePlansPage.styles';
import { asRecord, toCleanString } from './subscription.utils';

const DeveloperSubscriptionMaintenancePlansPage = () => {
  const {
    plans = [],
    plansLoading,
    openDefinitionForPlan,
    openVersioningForPlan,
    updatePlanLifecycle,
    deletePlanDefinition,
    fieldCatalog,
    saveFieldCatalog,
    openDevModal,
  } = useDeveloperSubscriptionMaintenanceContext();

  const [catalogOpen, setCatalogOpen] = useState(false);

  return (
    <>
      <PageContent>
        <PageHeader>
          <HeaderText>
            <PageTitle>
              <TitleIcon>
                <FontAwesomeIcon icon={faLayerGroup} />
              </TitleIcon>
              Mantenimiento de Suscripciones
            </PageTitle>
          </HeaderText>
          <HeaderActions>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'sandbox-checkout',
                    icon: <FontAwesomeIcon icon={faFlaskVial} />,
                    label: 'Simular checkout',
                    onClick: () => openDevModal('sandbox-checkout'),
                  },
                  {
                    key: 'sandbox-flow',
                    icon: <FontAwesomeIcon icon={faFlaskVial} />,
                    label: 'Escenarios mock',
                    onClick: () => openDevModal('sandbox-flow'),
                  },
                  {
                    key: 'assignment',
                    icon: <FontAwesomeIcon icon={faWrench} />,
                    label: 'Asignacion de suscripcion',
                    onClick: () => openDevModal('assignment'),
                  },
                  {
                    key: 'payment',
                    icon: <FontAwesomeIcon icon={faClockRotateLeft} />,
                    label: 'Historial manual de pago',
                    onClick: () => openDevModal('payment'),
                  },
                ],
              }}
              trigger={['click']}
            >
              <Button icon={<FontAwesomeIcon icon={faWrench} />}>
                Herramientas
              </Button>
            </Dropdown>
            <Button
              icon={<FontAwesomeIcon icon={faSliders} />}
              onClick={() => setCatalogOpen(true)}
            >
              Catalogo de campos
            </Button>
            <Button
              type="primary"
              icon={<FontAwesomeIcon icon={faPlus} />}
              onClick={() => openDefinitionForPlan(null)}
            >
              Suscripcion
            </Button>
          </HeaderActions>
        </PageHeader>

        {plansLoading && plans.length === 0 ? (
          <LoadingContainer>
            <Spin size="large" />
            <LoadingText>Cargando catalogo...</LoadingText>
          </LoadingContainer>
        ) : plans.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <FontAwesomeIcon icon={faLayerGroup} />
            </EmptyIcon>
            <EmptyTitle>Sin suscripciones configuradas</EmptyTitle>
            <EmptyDesc>
              Primero crea la suscripcion base y luego agrega su primera
              version.
            </EmptyDesc>
            <Button type="primary" onClick={() => openDefinitionForPlan(null)}>
              Crear suscripcion base
            </Button>
          </EmptyState>
        ) : (
          <PlansGrid>
            {plans.map((plan) => {
              const record = asRecord(plan);
              const planCode = toCleanString(record.planCode);
              if (!planCode) return null;
              return (
                <DeveloperSubscriptionPlanCard
                  key={planCode}
                  plan={record}
                  onEditDefinition={openDefinitionForPlan}
                  onNewVersion={(targetPlan) =>
                    openVersioningForPlan(targetPlan)
                  }
                  onEditVersion={(version) =>
                    openVersioningForPlan(version, { preserveVersionId: true })
                  }
                  onUpdateLifecycle={updatePlanLifecycle}
                  onDeleteDefinition={deletePlanDefinition}
                />
              );
            })}
          </PlansGrid>
        )}
      </PageContent>

      <DeveloperFieldCatalogModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        fieldCatalog={fieldCatalog}
        onSave={saveFieldCatalog}
      />
    </>
  );
};

export default DeveloperSubscriptionMaintenancePlansPage;
