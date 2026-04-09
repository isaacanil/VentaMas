import { Modal } from 'antd';
import styled from 'styled-components';

import { DeveloperPaymentHistoryModal } from './DeveloperPaymentHistoryModal';
import { DeveloperPlanDefinitionModal } from './DeveloperPlanDefinitionModal';
import { DeveloperPlanVersioningModal } from './DeveloperPlanVersioningModal';
import { DeveloperSubscriptionAssignmentModal } from './DeveloperSubscriptionAssignmentModal';
import MockSubscriptionFlowCard from './MockSubscriptionFlowCard';
import { SimulatedPlanSelectionCard } from './SimulatedPlanSelectionCard';
import type { MockScenarioPayload } from './MockSubscriptionFlowCard';
import type { SimulatedBillingResult, SimulatedPlanOption } from './SimulatedPlanSelectionCard';
import type { SubscriptionFieldCatalog } from '../subscriptionFieldCatalog';
import type { DeveloperSubscriptionMaintenanceToolState } from '../useDeveloperSubscriptionMaintenancePage';

interface SandboxContext {
  activeBusinessId: string | null;
  canManagePayments: boolean;
  dynamicSimulatedPlans: SimulatedPlanOption[];
  selectedPlanCode: string;
  setSelectedPlanCode: (planCode: string) => void;
  selectedSimulatedPlan: SimulatedPlanOption | null;
  mockBusy: boolean;
  subscriptionPlanId: string | null;
  subscriptionPriceMonthly: number | null;
  planOptions: Array<{ label: string; value: string }>;
  handleRunMockScenario: (payload: MockScenarioPayload) => Promise<void>;
  handleRunSimulatedCheckout: (result: SimulatedBillingResult) => Promise<void>;
}

interface DeveloperSubscriptionMaintenanceModalsProps {
  developerTools: DeveloperSubscriptionMaintenanceToolState;
  fieldCatalog: SubscriptionFieldCatalog;
  onVersioningPlanSelection: (planCode: string) => void;
  sandboxContext: SandboxContext;
}

export const DeveloperSubscriptionMaintenanceModals = ({
  developerTools,
  fieldCatalog,
  onVersioningPlanSelection,
  sandboxContext,
}: DeveloperSubscriptionMaintenanceModalsProps) => {
  const {
    activeDevModal,
    assignPlanCode,
    assignTargetBusinessId,
    busyAction,
    catalogPlanOptions,
    closeDevModal,
    definitionCatalogStatus,
    definitionDisplayName,
    definitionIsNew,
    definitionPlanCode,
    devBusy,
    editorAddonsJson,
    editorDisplayName,
    editorEffectiveAt,
    editorLimitsJson,
    editorModulesJson,
    editorNoticeWindowDays,
    editorPlanCode,
    editorPlanLocked,
    editorPriceMonthly,
    editorVersionId,
    editorVersionIdMode,
    handleApplyVersionNow,
    handleAssignSubscription,
    handleEditorVersionIdChange,
    handlePreviewImpact,
    handlePublishVersion,
    handleRecordPayment,
    handleSaveDraftVersion,
    handleSavePlanDefinition,
    impactPreview,
    loadPlans,
    paymentAmount,
    paymentDescription,
    planOptions,
    plansLoading,
    resetEditorVersionIdToAuto,
    scope,
    setAssignPlanCode,
    setAssignTargetBusinessId,
    setDefinitionCatalogStatus,
    setDefinitionDisplayName,
    setDefinitionPlanCode,
    setEditorAddonsJson,
    setEditorDisplayName,
    setEditorLimitsJson,
    setEditorModulesJson,
    setEditorNoticeWindowDays,
    setEditorPriceMonthly,
    setPaymentAmount,
    setPaymentDescription,
    setScope,
  } = developerTools;

  return (
    <>
      <DeveloperSubscriptionAssignmentModal
        open={activeDevModal === 'assignment'}
        onClose={closeDevModal}
        plansLoading={plansLoading}
        planOptions={planOptions}
        assignPlanCode={assignPlanCode}
        onAssignPlanCodeChange={setAssignPlanCode}
        scope={scope}
        onScopeChange={setScope}
        assignTargetBusinessId={assignTargetBusinessId}
        onAssignTargetBusinessIdChange={setAssignTargetBusinessId}
        devBusy={devBusy}
        onAssignSubscription={() => {
          void handleAssignSubscription();
        }}
        onReloadCatalog={() => {
          void loadPlans();
        }}
      />

      <DeveloperPaymentHistoryModal
        open={activeDevModal === 'payment'}
        onClose={closeDevModal}
        devBusy={devBusy}
        paymentAmount={paymentAmount}
        onPaymentAmountChange={setPaymentAmount}
        paymentDescription={paymentDescription}
        onPaymentDescriptionChange={setPaymentDescription}
        onRecordPayment={() => {
          void handleRecordPayment();
        }}
      />

      <DeveloperPlanDefinitionModal
        open={activeDevModal === 'definition'}
        onClose={closeDevModal}
        devBusy={devBusy}
        definitionPlanCode={definitionPlanCode}
        onDefinitionPlanCodeChange={setDefinitionPlanCode}
        definitionDisplayName={definitionDisplayName}
        onDefinitionDisplayNameChange={setDefinitionDisplayName}
        definitionCatalogStatus={definitionCatalogStatus}
        onDefinitionCatalogStatusChange={setDefinitionCatalogStatus}
        definitionIsNew={definitionIsNew}
        onSaveDefinition={() => {
          void handleSavePlanDefinition();
        }}
      />

      <DeveloperPlanVersioningModal
        open={activeDevModal === 'versioning'}
        onClose={closeDevModal}
        devBusy={devBusy}
        busyAction={busyAction}
        planOptions={catalogPlanOptions}
        fieldCatalog={fieldCatalog}
        editorPlanCode={editorPlanCode}
        editorPlanLocked={editorPlanLocked}
        onEditorPlanCodeChange={onVersioningPlanSelection}
        editorVersionId={editorVersionId}
        editorVersionIdMode={editorVersionIdMode}
        onEditorVersionIdChange={handleEditorVersionIdChange}
        onResetEditorVersionIdToAuto={resetEditorVersionIdToAuto}
        editorDisplayName={editorDisplayName}
        onEditorDisplayNameChange={setEditorDisplayName}
        editorPriceMonthly={editorPriceMonthly}
        onEditorPriceMonthlyChange={setEditorPriceMonthly}
        editorNoticeWindowDays={editorNoticeWindowDays}
        onEditorNoticeWindowDaysChange={setEditorNoticeWindowDays}
        editorEffectiveAt={editorEffectiveAt}
        editorLimitsJson={editorLimitsJson}
        onEditorLimitsJsonChange={setEditorLimitsJson}
        editorModulesJson={editorModulesJson}
        onEditorModulesJsonChange={setEditorModulesJson}
        editorAddonsJson={editorAddonsJson}
        onEditorAddonsJsonChange={setEditorAddonsJson}
        impactPreview={impactPreview}
        onPreviewImpact={() => {
          void handlePreviewImpact();
        }}
        onApplyVersionNow={() => {
          void handleApplyVersionNow();
        }}
        onPublishVersion={() => {
          void handlePublishVersion();
        }}
        onSaveDraftVersion={() => {
          void handleSaveDraftVersion();
        }}
      />

      <Modal
        open={activeDevModal === 'sandbox-checkout'}
        onCancel={closeDevModal}
        footer={null}
        title="Simular resultado de checkout"
        width={500}
      >
        <ModalPad>
          <SimulatedPlanSelectionCard
            plans={sandboxContext.dynamicSimulatedPlans}
            selectedPlanCode={
              sandboxContext.selectedSimulatedPlan?.planCode ||
              sandboxContext.selectedPlanCode
            }
            onSelectPlan={sandboxContext.setSelectedPlanCode}
            onSimulateResult={sandboxContext.handleRunSimulatedCheckout}
            busy={sandboxContext.mockBusy}
            canManagePayments={sandboxContext.canManagePayments}
            hasActiveBusiness={Boolean(sandboxContext.activeBusinessId)}
          />
        </ModalPad>
      </Modal>

      <Modal
        open={activeDevModal === 'sandbox-flow'}
        onCancel={closeDevModal}
        footer={null}
        title="Escenarios mock de suscripción"
        width={460}
      >
        <ModalPad>
          <MockSubscriptionFlowCard
            enabled
            busy={sandboxContext.mockBusy}
            businessId={sandboxContext.activeBusinessId}
            canManagePayments={sandboxContext.canManagePayments}
            defaultPlanCode={
              sandboxContext.selectedSimulatedPlan?.planCode ||
              sandboxContext.subscriptionPlanId ||
              sandboxContext.selectedPlanCode
            }
            defaultAmount={sandboxContext.subscriptionPriceMonthly ?? 0}
            planOptions={
              sandboxContext.planOptions.length
                ? sandboxContext.planOptions
                : sandboxContext.dynamicSimulatedPlans.map((plan) => ({
                    label: `${plan.displayName} (${plan.planCode})`,
                    value: plan.planCode,
                  }))
            }
            onRunScenario={sandboxContext.handleRunMockScenario}
          />
        </ModalPad>
      </Modal>
    </>
  );
};

const ModalPad = styled.div`
  padding-top: 4px;
`;

