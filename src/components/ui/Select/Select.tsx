import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import { InputV4 } from '@/components/ui/Inputs/GeneralInput/InputV4';

const getValueByKeyOrPath = (obj: any, keyOrPath: string | number): any => {
  if (typeof keyOrPath === 'string' && keyOrPath.includes('.')) {
    return keyOrPath.split('.').reduce((o: any, key: string) => o && (o as any)[key], obj);
  }
  return (obj as any)[keyOrPath as string];
};

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
  const SelectRef = useRef<HTMLDivElement>(null);
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
    setIsOpen(false);
    onChange({ target: { value: select } });
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
    setSearchTerm(''); // Si quieres reiniciar el término de búsqueda también
    setIsOpen(false);
    onChange({ target: { value: null } }); // Aquí puedes enviar un valor nulo para indicar que se ha reseteado
    onNoneOptionSelected && onNoneOptionSelected();
  };

  useEffect(() => {
    if (!value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Necessary for synchronizing internal state (searchTerm, isOpen) with the 'value' prop
      setSearchTerm(''); // Si quieres reiniciar el término de búsqueda también
      setIsOpen(false);
    }
  }, [value]);

  useClickOutSide(SelectRef as React.RefObject<HTMLElement>, isOpen, () => {
    setIsOpen(false);
  });

  return (
    <Container ref={SelectRef}>
      <OtherContainer>
        {(value || labelVariant === 'label2' || labelVariant === 'label1') && (
          <Label $labelVariant={labelVariant}>{title}:</Label>
        )}
        {props.required && (
          <Asterisk style={{ color: 'red' }}>{icons.forms.asterisk}</Asterisk>
        )}
      </OtherContainer>
      <Head ref={setReference}>
        {isLoading === true ? (
          <Group>
            <h3>{'cargando ...'}</h3>
            <Icon>{icons.arrows.chevronDown}</Icon>
          </Group>
        ) : (
          <Group onClick={() => setIsOpen(!isOpen)}>
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
              <Item
                $selected={!value}
                onClick={() => handleReset()}
              >
                Ninguno
              </Item>
              {filteredItems.map((item, index) => (
                <Item
                  key={index}
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
const Asterisk = styled.span`

  padding-left: 8px;
  color: red;

  svg {
    font-size: 0.8em;
  }
`;
const OtherContainer = styled.div`
  display: flex;
`;
const Container = styled.div`
  position: relative;
  width: 100%;
  max-width: 300px;
  height: min-content;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 0 0 0.2em;
  overflow: hidden;
  background-color: var(--white);
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: var(--border-radius-light);
  transition-timing-function: ease-in-out;
  transition-duration: 20s;
  transition-property: all;
`;
const Body = styled.div`
  position: absolute;
  z-index: 999999999999;
  width: 100%;
  min-width: 300px;
  height: 300px;
  max-height: 300px;
  overflow: hidden;
  background-color: #fff;
  border: 1px solid rgb(0 0 0 / 20%);
  border-radius: 6px;
  box-shadow: 0 0 20px rgb(0 0 0 / 20%);
`;
const List = styled.ul`
  z-index: 1;
  display: block;
  height: 100%;
  padding: 0;
  overflow-y: auto;
`;
const Group = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.2em;
  padding-right: 0.5em;
  transition: 1s display ease-in-out;

  h3 {
    display: -webkit-box;
    width: 100%;
    margin: 0 0 0 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    font-size: 1em;
    font-weight: 500;
    line-height: 1pc;
    color: rgb(66 66 66);
    text-transform: uppercase;

    /* white-space: nowrap; */
    -webkit-box-orient: vertical;
  }
`;

interface ItemProps {
  $selected?: boolean;
}

const Item = styled.p<ItemProps>`
  list-style: none;
  padding: 0 1em;
  display: flex;
  align-items: center;
  height: 2.4em;

  &:hover {
    color: white;
    background-color: var(--color);
  }

  ${({ $selected }: ItemProps) => {
    if ($selected) {
      return `
                background-color: #4081d6;
                color: white;
            `;
    }
  }}
`;
const Icon = styled.div`
  display: flex;
  align-items: center;
  width: 0.8em;
  height: 1em;
`;
const SearchSection = styled.div`
  position: sticky;
  top: 0;
  padding: 0.2em;
  background-color: var(--white-2);
  border-bottom: 1px solid rgb(0 0 0 / 10%);
`;
const NoneItemMessageContainer = styled.div`
  padding: 1em;
`;
interface LabelProps {
  $labelVariant?: 'primary' | 'label2' | 'label1';
}

const Label = styled.label<LabelProps>`
  font-size: 13px;
  color: var(--gray-5);
  margin-bottom: 4px;
  ${({ $labelVariant }: LabelProps) => {
    switch ($labelVariant) {
      case 'primary':
        return `
        font-size: 11px;
        color: var(--gray-5);
        position: absolute;
        z-index: 1;
        background-color: white;
        padding: 0 4px;
        top: -5px;
        line-height: 1;
        height: min-content;
        color: #353535;
        font-weight: 600;
          ::after {
            content: ' :';
          }
        `;
      case 'label2':
        return `
          font-size: 16px;
        color: black;
        margin-bottom: 10px;
        display: block;
        `;
      default:
        return `
        font-size: 13px;
        color: var(--gray-5);
        margin-bottom: 4px;
        `;
    }
  }}
`;