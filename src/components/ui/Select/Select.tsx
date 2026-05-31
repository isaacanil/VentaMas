import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { useCallback, useRef, useState, type RefObject } from 'react';

import { icons } from '@/constants/icons/icons';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import { InputV4 } from '@/components/ui/Inputs/GeneralInput/InputV4';

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

interface SelectProps {
  title?: string;
  data: any[];
  value: any;
  onChange: (e: { target: { value: any } }) => void;
  displayKey: string;
  labelVariant?: 'primary' | 'label2' | 'label1';
  onNoneOptionSelected?: () => void;
  isLoading?: boolean;
  required?: boolean;
  [key: string]: any;
}

export const Select = ({
  title,
  data,
  value,
  onChange,
  displayKey,
  labelVariant = 'primary',
  onNoneOptionSelected,
  isLoading = false,
  ...props
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleSelect = (select: any) => {
    setSearchTerm('');
    setIsOpen(false);
    onChange({ target: { value: select } });
  };

  const handleToggleOpen = () => {
    if (!isOpen) {
      setSearchTerm('');
    }

    setIsOpen((prev) => !prev);
  };

  const filteredItems = Array.isArray(data)
    ? data.filter((item) => {
        const value = getValueByKeyOrPath(item, displayKey);
        return (
          value &&
          (typeof value === 'string' || typeof value === 'number') &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <Container ref={selectRef}>
      <OtherContainer>
        {(value || labelVariant === 'label2' || labelVariant === 'label1') && (
          <Label $labelVariant={labelVariant}>{title}:</Label>
        )}
        {props.required && <Asterisk>{icons.forms.asterisk}</Asterisk>}
      </OtherContainer>
      <Head ref={setReference}>
        {isLoading === true ? (
          <Group>
            <h3>{'cargando ...'}</h3>
            <Icon>{icons.arrows.chevronDown}</Icon>
          </Group>
        ) : (
          <Group onClick={handleToggleOpen}>
            <h3>{value ? value : title ? title : ''}</h3>
            <Icon>
              {!isOpen ? icons.arrows.chevronDown : icons.arrows.chevronUp}
            </Icon>
          </Group>
        )}
      </Head>
      {isOpen ? (
        <Body ref={setFloating} style={floatingStyles}>
          {data?.length > 0 ? (
            <List>
              <SearchSection>
                <InputV4
                  icon={icons.forms.search}
                  placeholder={`Buscar ${title}`}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="medium"
                  value={searchTerm}
                  onClear={() => setSearchTerm('')}
                />
              </SearchSection>
              <Item $selected={!value} onClick={handleReset}>
                Ninguno
              </Item>
              {filteredItems.map((item) => (
                <Item
                  key={getItemKey(item, displayKey)}
                  $selected={value === getValueByKeyOrPath(item, displayKey)}
                  onClick={() => handleSelect(item)}
                >
                  {getValueByKeyOrPath(item, displayKey)}
                </Item>
              ))}
            </List>
          ) : (
            filteredItems.length === 0 && (
              <NoneItemMessageContainer>
                No hay {title}.
              </NoneItemMessageContainer>
            )
          )}
        </Body>
      ) : null}
    </Container>
  );
};
