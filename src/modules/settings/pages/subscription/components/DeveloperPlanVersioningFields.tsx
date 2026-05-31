import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input, InputNumber, Switch, Tooltip, Typography } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import type { JSX } from 'react';

import type { SubscriptionFieldDefinition } from '../subscriptionFieldCatalog';
import {
  EditorWrapper,
  EditorHeader,
  LabelHelp,
  HelpIconButton,
  EntryList,
  EmptyMessage,
  EntryRow,
  EntryLabel,
  EntryValue,
  NumberDisplay,
} from './DeveloperPlanVersioningModal.styles';

type UnknownRecord = Record<string, unknown>;
type ValueType = 'number' | 'boolean' | 'string';

interface KeyValueEditorProps {
  jsonString: string;
  onChange: (json: string) => void;
  fieldDefinitions: Record<string, SubscriptionFieldDefinition>;
  sectionLabel: string;
}

export const LabelWithHelp = ({
  label,
  help,
}: {
  label: string;
  help: string;
}): JSX.Element => (
  <LabelHelp>
    <span>{label}</span>
    <Tooltip title={help}>
      <HelpIconButton
        type="text"
        size="small"
        icon={<FontAwesomeIcon icon={faCircleQuestion} />}
        tabIndex={-1}
      />
    </Tooltip>
  </LabelHelp>
);

const safeParseJson = (raw: string): UnknownRecord => {
  try {
    const parsed: unknown = JSON.parse(raw.trim() || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as UnknownRecord;
    }
  } catch {
    /* ignore */
  }
  return {};
};

const detectValueType = (value: unknown): ValueType => {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
};

export const KeyValueEditor = ({
  jsonString,
  onChange,
  fieldDefinitions,
  sectionLabel,
}: KeyValueEditorProps): JSX.Element => {
  const data = useMemo(() => safeParseJson(jsonString), [jsonString]);

  const entries = useMemo(
    () =>
      Object.values(fieldDefinitions)
        .filter((definition) => definition.isActive !== false)
        .sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.key.localeCompare(b.key, 'es');
        })
        .map((def) => {
          const stored = data[def.key];
          const value =
            stored !== undefined ? stored : def.type === 'number' ? 0 : false;
          return [def.key, value] as [string, unknown];
        }),
    [data, fieldDefinitions],
  );

  const [editingKey, setEditingKey] = useState<string | null>(null);

  const emitChange = useCallback(
    (updated: UnknownRecord) => {
      onChange(JSON.stringify(updated, null, 2));
    },
    [onChange],
  );

  const handleValueChange = useCallback(
    (key: string, newValue: unknown) => {
      const updated = { ...data, [key]: newValue };
      emitChange(updated);
    },
    [data, emitChange],
  );

  return (
    <EditorWrapper>
      <EditorHeader>
        <Typography.Text strong style={{ fontSize: 13 }}>
          {sectionLabel}
        </Typography.Text>
      </EditorHeader>

      <EntryList>
        {entries.length === 0 && (
          <EmptyMessage>Sin campos en el catálogo</EmptyMessage>
        )}
        {entries.map(([key, value]) => {
          const type = detectValueType(value);
          const isEditing = editingKey === key;

          return (
            <EntryRow key={key}>
              <EntryLabel title={key}>
                {fieldDefinitions[key]?.label ?? key}
              </EntryLabel>

              <EntryValue>
                {type === 'boolean' && (
                  <Switch
                    size="small"
                    checked={value === true}
                    onChange={(checked) => handleValueChange(key, checked)}
                  />
                )}

                {type === 'number' && !isEditing && (
                  <NumberDisplay
                    onClick={() => setEditingKey(key)}
                    tabIndex={0}
                    onFocus={() => setEditingKey(key)}
                    title="Clic para editar"
                  >
                    {value === -1 ? (
                      <span className="unlimited">Ilimitado</span>
                    ) : (
                      Number(value).toLocaleString()
                    )}
                  </NumberDisplay>
                )}

                {type === 'number' && isEditing && (
                  <InputNumber
                    size="small"
                    value={value as number}
                    onChange={(v) => handleValueChange(key, v ?? 0)}
                    onBlur={() => setEditingKey(null)}
                    onPressEnter={() => setEditingKey(null)}
                    style={{ width: 120 }}
                    min={-1}
                  />
                )}

                {type === 'string' && (
                  <Input
                    size="small"
                    value={String(value)}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    style={{ width: 140 }}
                  />
                )}
              </EntryValue>
            </EntryRow>
          );
        })}
      </EntryList>
    </EditorWrapper>
  );
};
