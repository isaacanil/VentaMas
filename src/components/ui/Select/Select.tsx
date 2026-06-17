import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  useFloating,
} from '@floating-ui/react';
import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';

import { icons } from '@/constants/icons/icons';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import { InputV4 } from '@/components/ui/Inputs';

import {
  Asterisk,
  Body,
  Container,
  Group,
  Head,
  Icon,
  Item,
  Label,
  List,
  NoneItemMessageContainer,
  OtherContainer,
  SearchSection,
} from './Select.styles';
import { getItemKey, getValueByKeyOrPath } from './Select.utils';

type SelectChangeEvent<TItem> = {
  target: {
    value: TItem | null;
  };
};

interface SelectProps<TItem = unknown> {
  title?: string;
  data: TItem[];
  value: ReactNode;
  onChange: (e: SelectChangeEvent<TItem>) => void;
  displayKey: string;
  labelVariant?: 'primary' | 'label2' | 'label1';
  onNoneOptionSelected?: () => void;
  isLoading?: boolean;
  required?: boolean;
  [key: string]: unknown;
}

export const Select = <TItem,>({
  title,
  data,
  value,
  onChange,
  displayKey,
  labelVariant = 'primary',
  onNoneOptionSelected,
  isLoading = false,
  required = false,
}: SelectProps<TItem>) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const listboxId = useId();
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [floatingOffset(8), flip(), shift({ padding: 8 })],
  });
  const setReference = useCallback(
    (node: HTMLElement | null) => refs.setReference(node),
    [refs],
  );
  const setFloating = useCallback(
    (node: HTMLElement | null) => refs.setFloating(node),
    [refs],
  );

  const handleSelect = (selectedItem: TItem) => {
    setSearchTerm('');
    setIsOpen(false);
    onChange({ target: { value: selectedItem } });
  };

  const handleToggleOpen = () => {
    if (!isOpen) {
      setSearchTerm('');
    }

    setIsOpen((prev) => !prev);
  };

  const handleTriggerKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSearchTerm('');
      setIsOpen(true);
    }
  };

  const filteredItems = Array.isArray(data)
    ? data.filter((item) => {
        const itemValue = getValueByKeyOrPath(item, displayKey);
        return (
          itemValue &&
          (typeof itemValue === 'string' || typeof itemValue === 'number') &&
          itemValue
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      })
    : [];

  const handleReset = () => {
    setSearchTerm('');
    setIsOpen(false);
    onChange({ target: { value: null } });
    onNoneOptionSelected?.();
  };

  useClickOutSide(selectRef as RefObject<HTMLElement>, isOpen, () => {
    setIsOpen(false);
  });

  const triggerLabel = value || title || 'Seleccionar';

  return (
    <Container ref={selectRef}>
      <OtherContainer>
        {(value || labelVariant === 'label2' || labelVariant === 'label1') && (
          <Label $labelVariant={labelVariant}>{title}:</Label>
        )}
        {required && <Asterisk>{icons.forms.asterisk}</Asterisk>}
      </OtherContainer>
      <Head
        ref={setReference}
        type="button"
        onClick={isLoading ? undefined : handleToggleOpen}
        onKeyDown={handleTriggerKeyDown}
        disabled={isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
      >
        <Group>
          <h3>{isLoading ? 'cargando ...' : triggerLabel}</h3>
          <Icon>
            {isOpen ? icons.arrows.chevronUp : icons.arrows.chevronDown}
          </Icon>
        </Group>
      </Head>
      {isOpen ? (
        <Body ref={setFloating} style={floatingStyles}>
          {data?.length > 0 ? (
            <List id={listboxId} role="listbox" aria-label={title || 'Opciones'}>
              <SearchSection role="search">
                <InputV4
                  icon={icons.forms.search}
                  placeholder={`Buscar ${title || 'opcion'}`}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="medium"
                  value={searchTerm}
                  onClear={() => setSearchTerm('')}
                />
              </SearchSection>
              <Item
                type="button"
                role="option"
                $selected={!value}
                aria-selected={!value}
                onClick={handleReset}
              >
                Ninguno
              </Item>
              {filteredItems.map((item) => {
                const itemValue = getValueByKeyOrPath(item, displayKey);
                const selected = value === itemValue;

                return (
                  <Item
                    key={getItemKey(item, displayKey)}
                    type="button"
                    role="option"
                    $selected={selected}
                    aria-selected={selected}
                    onClick={() => handleSelect(item)}
                  >
                    {itemValue}
                  </Item>
                );
              })}
            </List>
          ) : (
            filteredItems.length === 0 && (
              <NoneItemMessageContainer role="status">
                No hay {title}.
              </NoneItemMessageContainer>
            )
          )}
        </Body>
      ) : null}
    </Container>
  );
};
