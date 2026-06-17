import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { icons } from '@/constants/icons/icons';
import { normalizeSearchText } from '@/utils/searchText';

import type {
  GeneralConfigSearchEntry,
  GeneralConfigSearchRecord,
} from '../../hooks/useGeneralConfigController';
import {
  Backdrop,
  ClearBtn,
  Empty,
  EscBadge,
  InputRow,
  ResultArrow,
  ResultBody,
  ResultIcon,
  ResultItem,
  ResultMeta,
  ResultsList,
  ResultTitle,
  SpotlightInput,
  SpotlightPanel,
  SpotlightSearchIcon,
  TriggerButton,
  TriggerIcon,
} from './GeneralConfigSearch.styles';

const EMPTY_RESULTS_TEXT = 'Sin resultados';
const SHORTCUT_LABEL = navigator.platform.includes('Mac') ? 'Cmd K' : 'Ctrl K';

const EMPTY_GENERAL_CONFIG_RECORDS: GeneralConfigSearchRecord[] = [];

interface TriggerProps {
  onOpen: () => void;
}

export const GeneralConfigSearchTrigger = ({ onOpen }: TriggerProps) => (
  <TriggerButton
    type="button"
    onClick={onOpen}
    title={`Buscar configuracion (${SHORTCUT_LABEL})`}
  >
    <TriggerIcon aria-hidden="true">{icons.operationModes.search}</TriggerIcon>
  </TriggerButton>
);

interface GeneralConfigSearchProps {
  isOpen: boolean;
  records?: GeneralConfigSearchRecord[];
  onSelect?: (entry: GeneralConfigSearchEntry) => void;
  onClose: () => void;
  dependencyKey?: string | number;
  placeholder?: string;
}

export const GeneralConfigSearch = ({
  isOpen,
  records = EMPTY_GENERAL_CONFIG_RECORDS,
  onSelect,
  onClose,
  dependencyKey,
  placeholder = 'Buscar en configuracion...',
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
  const prevDependencyKeyRef = useRef<string | number | undefined>(
    dependencyKey,
  );

  useEffect(() => {
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(focusTimer);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (dependencyKey === prevDependencyKeyRef.current) return;

    prevDependencyKeyRef.current = dependencyKey;
    onClose();
  }, [dependencyKey, onClose]);

  const filteredOptions = useMemo<GeneralConfigSearchRecord[]>(() => {
    if (!inputValue) return records.slice(0, 8);

    const normalized = normalizeSearchText(inputValue);
    return records
      .filter((record) =>
        record.tokens.some((token) => token.includes(normalized)),
      )
      .slice(0, 10);
  }, [inputValue, records]);

  const safeIndex =
    filteredOptions.length === 0
      ? -1
      : activeIndex >= filteredOptions.length
        ? filteredOptions.length - 1
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
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) =>
          Math.min(current + 1, filteredOptions.length - 1),
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => (current <= 0 ? -1 : current - 1));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const index = safeIndex >= 0 ? safeIndex : 0;
        handleSelect(filteredOptions[index]?.entry);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    },
    [safeIndex, filteredOptions, handleSelect, onClose],
  );

  return (
    <Backdrop onClick={onClose}>
      <SpotlightPanel
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en configuracion"
      >
        <InputRow>
          <SpotlightSearchIcon>
            {icons.operationModes.search}
          </SpotlightSearchIcon>
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
            onChange={(event) => {
              setInputValue(event.target.value);
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
            filteredOptions.map((option, index) => (
              <ResultItem
                key={option.key}
                id={`gcs-option-${option.key}`}
                role="option"
                aria-selected={index === safeIndex}
                $active={index === safeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option.entry)}
              >
                <ResultIcon>{icons.operationModes.search}</ResultIcon>
                <ResultBody>
                  <ResultTitle>{option.label}</ResultTitle>
                  <ResultMeta>{option.category}</ResultMeta>
                </ResultBody>
                <ResultArrow>Enter</ResultArrow>
              </ResultItem>
            ))
          )}
        </ResultsList>
      </SpotlightPanel>
    </Backdrop>
  );
};
