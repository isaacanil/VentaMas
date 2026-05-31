import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Space,
  Tabs,
  notification,
} from 'antd';
import { useCallback, useState } from 'react';
import {
  ModalDescription,
  SectionWrapper,
  FieldList,
  FieldRow,
  FieldOrderControls,
  OrderBtn,
  FieldBody,
  FieldHeader,
  FieldKey,
  TypeBadge,
  FieldControls,
  ControlLabel,
} from './DeveloperFieldCatalogModal.styles';

import type { JSX } from 'react';
import {
  buildEditableSubscriptionFieldCatalog,
  type SubscriptionFieldCatalog,
  type SubscriptionFieldDefinition,
} from '../subscriptionFieldCatalog';

type SectionKey = 'limits' | 'modules' | 'addons';
type DraftSection = SubscriptionFieldDefinition[];

interface CatalogDraft {
  limits: DraftSection;
  modules: DraftSection;
  addons: DraftSection;
}

const catalogToDraft = (catalog: SubscriptionFieldCatalog): CatalogDraft => ({
  limits: Object.values(catalog.limits).sort((a, b) => a.order - b.order),
  modules: Object.values(catalog.modules).sort((a, b) => a.order - b.order),
  addons: Object.values(catalog.addons).sort((a, b) => a.order - b.order),
});

const draftToCatalog = (draft: CatalogDraft): SubscriptionFieldCatalog => ({
  limits: Object.fromEntries(
    draft.limits.map((field, index) => [
      field.key,
      { ...field, order: (index + 1) * 10 },
    ]),
  ),
  modules: Object.fromEntries(
    draft.modules.map((field, index) => [
      field.key,
      { ...field, order: (index + 1) * 10 },
    ]),
  ),
  addons: Object.fromEntries(
    draft.addons.map((field, index) => [
      field.key,
      { ...field, order: (index + 1) * 10 },
    ]),
  ),
});

interface SectionEditorProps {
  fields: DraftSection;
  onChange: (updated: DraftSection) => void;
}

const SectionEditor = ({
  fields,
  onChange,
}: SectionEditorProps): JSX.Element => {
  const handleMove = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const next = [...fields];
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      onChange(next);
    },
    [fields, onChange],
  );

  const handlePatchField = useCallback(
    (index: number, patch: Partial<SubscriptionFieldDefinition>) => {
      onChange(
        fields.map((field, fieldIndex) =>
          fieldIndex === index ? { ...field, ...patch } : field,
        ),
      );
    },
    [fields, onChange],
  );

  return (
    <SectionWrapper>
      <FieldList>
        {fields.map((field, idx) => (
          <FieldRow key={field.key}>
            <FieldOrderControls>
              <OrderBtn
                type="text"
                size="small"
                disabled={idx === 0}
                icon={<FontAwesomeIcon icon={faArrowUp} />}
                onClick={() => handleMove(idx, 'up')}
              />
              <OrderBtn
                type="text"
                size="small"
                disabled={idx === fields.length - 1}
                icon={<FontAwesomeIcon icon={faArrowDown} />}
                onClick={() => handleMove(idx, 'down')}
              />
            </FieldOrderControls>

            <FieldBody>
              <FieldHeader>
                <FieldKey>{field.key}</FieldKey>
                <TypeBadge $type={field.type}>
                  {field.type === 'number' ? 'Numero' : 'Activable'}
                </TypeBadge>
              </FieldHeader>

              <Input
                size="small"
                value={field.label}
                onChange={(event) =>
                  handlePatchField(idx, { label: event.target.value })
                }
                placeholder="Etiqueta visible"
              />

              <FieldControls>
                <Checkbox
                  checked={field.isActive !== false}
                  onChange={(event) =>
                    handlePatchField(idx, { isActive: event.target.checked })
                  }
                >
                  <ControlLabel>Visible</ControlLabel>
                </Checkbox>

                {field.type === 'number' ? (
                  <Checkbox
                    checked={field.allowUnlimited === true}
                    onChange={(event) =>
                      handlePatchField(idx, {
                        allowUnlimited: event.target.checked,
                      })
                    }
                  >
                    <ControlLabel>Permite ilimitado</ControlLabel>
                  </Checkbox>
                ) : null}
              </FieldControls>
            </FieldBody>
          </FieldRow>
        ))}
      </FieldList>
    </SectionWrapper>
  );
};

export interface DeveloperFieldCatalogModalProps {
  open: boolean;
  onClose: () => void;
  fieldCatalog: SubscriptionFieldCatalog;
  onSave: (catalog: SubscriptionFieldCatalog) => Promise<void>;
}

export const DeveloperFieldCatalogModal = ({
  open,
  onClose,
  fieldCatalog,
  onSave,
}: DeveloperFieldCatalogModalProps): JSX.Element => {
  const [draft, setDraft] = useState<CatalogDraft>(() =>
    catalogToDraft(buildEditableSubscriptionFieldCatalog(fieldCatalog)),
  );
  const [saving, setSaving] = useState(false);

  const updateSection = useCallback(
    (section: SectionKey) => (updated: DraftSection) => {
      setDraft((prev) => ({ ...prev, [section]: updated }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(draftToCatalog(draft));
      notification.success({ message: 'Catalogo actualizado correctamente.' });
      onClose();
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo guardar el catalogo',
        description:
          error instanceof Error ? error.message : 'Error inesperado.',
      });
    }
    setSaving(false);
  }, [draft, onClose, onSave]);

  const tabs = [
    {
      key: 'limits',
      label: 'Limites',
      children: (
        <SectionEditor
          fields={draft.limits}
          onChange={updateSection('limits')}
        />
      ),
    },
    {
      key: 'modules',
      label: 'Modulos',
      children: (
        <SectionEditor
          fields={draft.modules}
          onChange={updateSection('modules')}
        />
      ),
    },
    {
      key: 'addons',
      label: 'Add-ons',
      children: (
        <SectionEditor
          fields={draft.addons}
          onChange={updateSection('addons')}
        />
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Catalogo de campos"
      width={720}
      footer={
        <Space>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="primary"
            loading={saving}
            onClick={() => void handleSave()}
          >
            Guardar catalogo
          </Button>
        </Space>
      }
      destroyOnHidden
      afterOpenChange={(isOpen) => {
        if (!isOpen) return;
        setDraft(
          catalogToDraft(buildEditableSubscriptionFieldCatalog(fieldCatalog)),
        );
      }}
    >
      <ModalDescription>
        Configura solo metadatos de campos soportados por el sistema. Firestore
        controla la presentacion y visibilidad; el contrato de keys sigue en
        codigo.
      </ModalDescription>
      <Tabs items={tabs} />
    </Modal>
  );
};

export default DeveloperFieldCatalogModal;
