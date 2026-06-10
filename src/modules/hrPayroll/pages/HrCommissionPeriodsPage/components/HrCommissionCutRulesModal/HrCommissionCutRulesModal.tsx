import { VmButton, VmModal } from '@/components/heroui';
import { SaveOutlined } from '@/constants/icons/antd';
import type {
  HrCommissionCutRuleInput,
  HrCommissionCutRuleRecord,
} from '@/types/hrPayroll';

import { HrCommissionCutRulesPanel } from '../HrCommissionCutRulesPanel/HrCommissionCutRulesPanel';
import { ModalActions } from './HrCommissionCutRulesModal.styles';

interface HrCommissionCutRulesModalProps {
  actionKey: string | null;
  isOpen: boolean;
  loading?: boolean;
  onCancel: () => void;
  onSave: (rule: HrCommissionCutRuleInput) => Promise<boolean>;
  rules: HrCommissionCutRuleRecord[];
}

const resolveConfigurationRule = (rules: HrCommissionCutRuleRecord[]) =>
  rules.find((rule) => rule.active) ?? rules[0] ?? null;

export function HrCommissionCutRulesModal({
  actionKey,
  isOpen,
  loading = false,
  onCancel,
  onSave,
  rules,
}: HrCommissionCutRulesModalProps) {
  const configurationRule = resolveConfigurationRule(rules);
  const saveKey = `cut-rule:save:${configurationRule?.id ?? 'new'}`;
  const saving = actionKey === saveKey;
  const formDisabled = loading || saving;

  return (
    <VmModal
      title="Configuración de cortes"
      ariaLabel="Configurar reglas de corte"
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      size="lg"
      footer={
        <ModalActions>
          <VmButton variant="secondary" isDisabled={saving} onPress={onCancel}>
            Cerrar
          </VmButton>
          <VmButton
            type="submit"
            form="hr-cut-rule-form"
            variant="primary"
            isDisabled={formDisabled}
          >
            <SaveOutlined />
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </VmButton>
        </ModalActions>
      }
    >
      <HrCommissionCutRulesPanel
        key={`${configurationRule?.id ?? 'new'}:${isOpen ? 'open' : 'closed'}`}
        actionKey={actionKey}
        loading={loading}
        rules={rules}
        variant="embedded"
        onSave={onSave}
      />
    </VmModal>
  );
}

export default HrCommissionCutRulesModal;
