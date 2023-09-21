import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { IoIosArrowDown } from 'react-icons/io'
import { MdClear } from 'react-icons/md'
import { useClickOutSide } from '../../../../hooks/useClickOutSide';
import { icons } from '../../../../constants/icons/icons';

import { usePopper } from 'react-popper';
import { InputV4 } from '../Inputs/GeneralInput/InputV4';
import { CenteredText } from '../CentredText';

const getValueByKeyOrPath = (obj, keyOrPath) => {
  if (typeof keyOrPath === 'string' && keyOrPath.includes('.')) {
    return keyOrPath.split('.').reduce((o, key) => o && o[key], obj);
  }
  return obj[keyOrPath];
}

const containerVariants = {
  open: {
    clipPath: "inset(0% 0% 0% 0% round 4px)",
    transition: {
      type: "spring",
      bounce: 0,
      duration: 0.7,
      delayChildren: 0.3,
      staggerChildren: 0.05
    }
  },
  closed: {
    clipPath: "inset(100% 0% 0% 0% round 10px)",
    transition: {
      type: "spring",
      bounce: 0,
      duration: 0.3
    }
  }
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  //referencia al contenedor del select
  const SelectRef = useRef(null)
  //termino de busqueda
  const [searchTerm, setSearchTerm] = useState('');
  // Popper
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  //estilos de popper
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [{ name: 'arrow' }],
  });

  const handleSelect = select => {
    setIsOpen(false);
    onChange({ target: { value: select } });
  };

  const filteredItems = Array.isArray(data)
    ? data.filter((item) => {
      const value = getValueByKeyOrPath(item, displayKey);
      return value && (typeof value === 'string' || typeof value === 'number') && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
    : [];

  const handleReset = () => {
    setSearchTerm(''); // Si quieres reiniciar el término de búsqueda también
    setIsOpen(false);
    onChange({ target: { value: null } }); // Aquí puedes enviar un valor nulo para indicar que se ha reseteado
    onNoneOptionSelected && onNoneOptionSelected();
  }

  useEffect(() => {
    if (!value) {
      setSearchTerm(''); // Si quieres reiniciar el término de búsqueda también
      setIsOpen(false);
      onChange({ target: { value: null } }); // Aquí puedes enviar un valor nulo para indicar que se ha reseteado
    }
  }, [])

  useClickOutSide(SelectRef, isOpen, () => { setIsOpen(false) })

  return (
    <Container ref={SelectRef}>
      <OtherContainer>
        {
          (value || labelVariant === 'label2') && (
            <Label
              labelVariant={labelVariant}
            >
              {title}:
            </Label>
          )
        }
        {
          props.required && <Asterisk style={{ color: 'red', }}>{icons.forms.asterisk}</Asterisk>
        }
      </OtherContainer>

      <Head ref={setReferenceElement}>
        {isLoading === true ? (
          <Group>
            <h3>{'cargando ...'}</h3>
            <Icon>
              {icons.arrows.chevronDown}
            </Icon>
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
        <Body
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
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
                style={!value ? { backgroundColor: 'blue', color: 'white' } : null}
                onClick={() => handleReset()}
              >
                Ninguno
              </Item>
              {filteredItems.map((item, index) => (
                <Item
                  key={index}
                  style={value === getValueByKeyOrPath(item, displayKey) ? { backgroundColor: 'blue', color: 'white' } : null}
                  onClick={() => handleSelect(item)}
                >
                  {getValueByKeyOrPath(item, displayKey)}
                </Item>
              ))}
            </List>
          ) : (
            filteredItems.length === 0 && (
              <NoneItemMessageContainer>
                {
                  console.log('no hay resultados')
                }
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
  color: red;
  svg{
    font-size: 0.8em;
  }
  padding-left: 8px;

`
const OtherContainer = styled.div`
    display: flex;
    `
const Container = styled.div`
    position: relative;
    max-width: 200px;
    width: 100%;
`

const Head = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: var(--border-radius-light);
    background-color: var(--White);
    overflow: hidden;
    padding: 0 0 0 0.2em;
    transition-duration: 20s;
    transition-timing-function: ease-in-out;
    transition-property: all; 
`
const Body = styled.div`
    min-width: 300px;
    width: 100%;
    max-height: 300px;
    height: 300px;
    position: absolute;
    
   
    z-index: 99999;
    background-color: #ffffff;
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.200);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.200);
   
`
const List = styled.ul`
    z-index: 1;
    display: block;
    padding: 0;
    height: 100%;
    overflow-y: auto;
`
const Group = styled.div`
    height: 2.2em;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap:10px;
    transition: 1s display ease-in-out;
    padding-right: 0.5em;

    h3{
        margin: 0 0 0 10px;
        font-weight: 500;
        font-size: 1em;
        color: rgb(66, 66, 66);
        width: 100%;
        font-size: 12px;
        line-height: 1pc;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;  
        //white-space: nowrap;
        text-transform: uppercase;
        text-overflow: ellipsis;
        overflow: hidden;
    }
`

const Item = styled.p`
        list-style: none;
        padding: 0 1em;
        display: flex;
        align-items: center;
        height: 2.4em;
        background-color: var(--White2);
    &:hover{
        background-color: var(--color);
        color: white;
    }

    ${(props) => {
    if (props.selected) {
      return `
                background-color: #4081d6;
                color: white;
            `
    }
  }}

    
`
const InputText = styled.input.attrs({
  type: 'text'
})`
   
    height: 2.75em;
   border: none;
    width: 100%;
    padding: 0 0.4em;
    &:focus{
        outline: 2px solid #00000052;
    }
    

  `

const Button = styled.button`
    background-color: white;
    border: none;
    display: flex;
    align-items: center;
    padding: 0;
    justify-content: right;
`
const Icon = styled.div`
 height: 1em;
 width: 0.8em;
 display: flex;
 align-items: center;
`
const SearchSection = styled.div`
    position: sticky;
    top: 0;
    padding: 0.2em;
    background-color: var(--White2);
    border-bottom: 1px solid rgba(0, 0, 0, 0.100);
`
const NoneItemMessageContainer = styled.div`
    padding: 1em;
`
const Label = styled.label`
  font-size: 13px;
 color: var(--Gray5);
  margin-bottom: 4px;
  ${props => {
    switch (props.labelVariant) {
      case 'primary':
        return `
        font-size: 11px;
        color: var(--Gray5);
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
        `
      case 'label2':
        return `
          font-size: 16px;
        color: black;
        margin-bottom: 10px;
        display: block;
        `
      default:
        return `
        font-size: 13px;
        color: var(--Gray5);
        margin-bottom: 4px;
        `
    }
  }}
`