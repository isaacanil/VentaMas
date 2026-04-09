import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';

import { icons } from '@/constants/icons/icons';

const EMPTY_RESULTS_TEXT = 'Sin resultados';
const SHORTCUT_LABEL = navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl K';

interface GeneralConfigSearchEntry {
  key: string;
  label: string;
  description: string;
  category: string;
  sectionId?: string;
  route?: string;
}

interface GeneralConfigSearchRecord {
  key: string;
  label: string;
  description: string;
  category: string;
  tokens: string[];
  entry: GeneralConfigSearchEntry;
}

interface GeneralConfigSearchProps {
  isOpen: boolean;
  records?: GeneralConfigSearchRecord[];
  onSelect?: (entry: GeneralConfigSearchEntry) => void;
  onClose: () => void;
  dependencyKey?: string | number;
  placeholder?: string;
}

const EMPTY_GENERAL_CONFIG_RECORDS: GeneralConfigSearchRecord[] = [];

// ─── Trigger Button ──────────────────────────────────────────────────────────

interface TriggerProps {
  onOpen: () => void;
}

export const GeneralConfigSearchTrigger = ({ onOpen }: TriggerProps) => (
  <TriggerButton type="button" onClick={onOpen} title={`Buscar configuración (${SHORTCUT_LABEL})`}>
    <TriggerIcon aria-hidden="true">{icons.operationModes.search}</TriggerIcon>
  </TriggerButton>
);

// ─── Spotlight Modal ──────────────────────────────────────────────────────────

export const GeneralConfigSearch = ({
  isOpen,
  records = EMPTY_GENERAL_CONFIG_RECORDS,
  onSelect,
  onClose,
  dependencyKey,
  placeholder = 'Buscar en configuración...',
}: GeneralConfigSearchProps) => {
  if (!records.length || !isOpen) return null;

  return createPortal(
    <GeneralConfigSearchDialog
      records={records}
      onSelect={onSelect}
      onClose={onClose}
      dependencyKey={dependencyKey}
      placeholder={placeholder}
    />,
    document.body,
  );
};

interface GeneralConfigSearchDialogProps {
  records: GeneralConfigSearchRecord[];
  onSelect?: (entry: GeneralConfigSearchEntry) => void;
  onClose: () => void;
  dependencyKey?: string | number;
  placeholder: string;
}

const GeneralConfigSearchDialog = ({
  records,
  onSelect,
  onClose,
  dependencyKey,
  placeholder,
}: GeneralConfigSearchDialogProps) => {
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(focusTimer);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const [prevDependencyKey, setPrevDependencyKey] = useState<string | number | undefined>(dependencyKey);
  if (dependencyKey !== prevDependencyKey) {
    setPrevDependencyKey(dependencyKey);
    onClose();
  }

  const filteredOptions = useMemo<GeneralConfigSearchRecord[]>(() => {
    if (!inputValue) return records.slice(0, 8);
    const normalized = inputValue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return records.filter((r) => r.tokens.some((t) => t.includes(normalized))).slice(0, 10);
  }, [inputValue, records]);

  const safeIndex =
    filteredOptions.length === 0 ? -1
    : activeIndex >= filteredOptions.length ? filteredOptions.length - 1
    : activeIndex;

  const activeOptionId =
    safeIndex >= 0 && filteredOptions[safeIndex]
      ? `gcs-option-${filteredOptions[safeIndex].key}`
      : undefined;

  const handleSelect = useCallback(
    (entry?: GeneralConfigSearchEntry | null) => {
      if (!entry) return;
      onClose();
      onSelect?.(entry);
    },
    [onClose, onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((p) => Math.min(p + 1, filteredOptions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((p) => (p <= 0 ? -1 : p - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const idx = safeIndex >= 0 ? safeIndex : 0;
        handleSelect(filteredOptions[idx]?.entry);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [safeIndex, filteredOptions, handleSelect, onClose],
  );

  return (
    <Backdrop onClick={onClose}>
      <SpotlightPanel
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en configuración"
      >
        <InputRow>
          <SpotlightSearchIcon>{icons.operationModes.search}</SpotlightSearchIcon>
          <SpotlightInput
            ref={inputRef}
            value={inputValue}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={filteredOptions.length > 0}
            aria-controls="gcs-results"
            aria-activedescendant={activeOptionId}
            onChange={(e) => {
              setInputValue(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
          />
          {inputValue && (
            <ClearBtn
              type="button"
              onClick={() => {
                setInputValue('');
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
            >
              {icons.operationModes.close}
            </ClearBtn>
          )}
          <EscBadge>Esc</EscBadge>
        </InputRow>

        <ResultsList id="gcs-results" role="listbox">
          {filteredOptions.length === 0 ? (
            <Empty>{EMPTY_RESULTS_TEXT}</Empty>
          ) : (
            filteredOptions.map((opt, i) => (
              <ResultItem
                key={opt.key}
                id={`gcs-option-${opt.key}`}
                role="option"
                aria-selected={i === safeIndex}
                $active={i === safeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt.entry)}
              >
                <ResultIcon>{icons.operationModes.search}</ResultIcon>
                <ResultBody>
                  <ResultTitle>{opt.label}</ResultTitle>
                  <ResultMeta>{opt.category}</ResultMeta>
                </ResultBody>
                <ResultArrow>↵</ResultArrow>
              </ResultItem>
            ))
          )}
        </ResultsList>
      </SpotlightPanel>
    </Backdrop>
  );
};

// ─── Styled — Trigger ─────────────────────────────────────────────────────────

const TriggerButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: var(--ds-radius-md);
  background: transparent;
  color: var(--ds-color-text-secondary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    color: var(--ds-color-action-primary);
    background: var(--ds-color-interactive-hover-bg);
  }
`;

const TriggerIcon = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;
  flex-shrink: 0;
`;

const TriggerLabel = styled.span`
  flex: 1;
  text-align: left;
`;

const TriggerShortcut = styled.kbd`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  font-size: 0.68rem;
  font-family: inherit;
  font-weight: 600;
  color: #5d6d7e;
  background: #ffffff;
  border: 1px solid #c9d0db;
  border-bottom: 3px solid #b0bac6;
  border-radius: 4px;
  padding: 1px 6px;
  letter-spacing: 0.03em;
  box-shadow: 0 1px 0 #b0bac6;
  line-height: 1.6;
`;

// ─── Styled — Spotlight overlay ───────────────────────────────────────────────

const backdropIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const panelIn = keyframes`
  from { opacity: 0; transform: translateY(-12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)     scale(1);    }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  background: var(--ds-color-overlay-mask);
  backdrop-filter: blur(4px);
  animation: ${backdropIn} 0.15s ease;
`;

const SpotlightPanel = styled.div`
  width: 100%;
  max-width: 560px;
  margin: 0 16px;
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: 14px;
  box-shadow: var(--ds-shadow-lg);
  overflow: hidden;
  animation: ${panelIn} 0.18s cubic-bezier(0.22, 1, 0.36, 1);
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
`;

const SpotlightSearchIcon = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;
  color: var(--ds-color-text-secondary);
  flex-shrink: 0;
`;

const SpotlightInput = styled.input`
  flex: 1;
  font-size: var(--ds-font-size-md);
  font-family: var(--ds-font-family-base);
  color: var(--ds-color-text-primary);
  border: none;
  outline: none;
  background: transparent;

  &::placeholder {
    color: var(--ds-color-text-secondary);
  }
`;

const ClearBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: none;
  background: transparent;
  color: var(--ds-color-text-secondary);
  cursor: pointer;
  border-radius: var(--ds-radius-sm);
  transition: color 0.15s;

  &:hover { color: var(--ds-color-text-secondary); }
`;

const EscBadge = styled.kbd`
  font-size: 0.72rem;
  font-family: var(--ds-font-family-base);
  color: var(--ds-color-text-secondary);
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  padding: 2px 6px;
  flex-shrink: 0;
`;

const ResultsList = styled.div`
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
`;

const ResultItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: var(--ds-radius-lg);
  background: ${(p) =>
    p.$active
      ? 'var(--ds-color-interactive-selected-bg)'
      : 'transparent'};
  text-align: left;
  cursor: pointer;
  transition: background 0.12s;

  &:hover { background: var(--ds-color-interactive-hover-bg); }
`;

const ResultIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-secondary);
  font-size: 13px;
  flex-shrink: 0;
`;

const ResultBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultTitle = styled.span`
  display: block;
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const ResultMeta = styled.span`
  display: block;
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
  margin-top: 1px;
`;

const ResultArrow = styled.span`
  font-size: 0.8rem;
  color: var(--ds-color-text-secondary);
  flex-shrink: 0;
`;

const Empty = styled.div`
  padding: 20px;
  text-align: center;
  font-size: var(--ds-font-size-base);
  color: var(--ds-color-text-secondary);
`;
