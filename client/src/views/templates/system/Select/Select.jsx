import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { IoIosArrowDown } from 'react-icons/io'
import { MdClear } from 'react-icons/md'
import { useClickOutSide } from '../../../../hooks/useClickOutSide';
import { icons } from '../../../../constants/icons/icons';

import { usePopper } from 'react-popper';

const getValueByKeyOrPath = (obj, keyOrPath) => {
  if (typeof keyOrPath === 'string' && keyOrPath.includes('.')) {
    return keyOrPath.split('.').reduce((o, key) => o && o[key], obj);
  }
  return obj[keyOrPath];
}

export const Select = ({
  title,
  data,
  value,
  onChange,
  displayKey,
  onNoneOptionSelected,
  isLoading = false
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
      <Head ref={setReferenceElement}>
        {isLoading === true ? (
          <Group>
            <h3>{'cargando ...'}</h3>
            <Icon>
              {icons.arrows.chevronDown}
            </Icon>
          </Group>
        ) : !isOpen && (
          <Group onClick={() => setIsOpen(true)}>
            <h3>{value ? value : title ? title : ''}</h3>
            <Icon>
              {icons.arrows.chevronDown}
            </Icon>
          </Group>
        )}
        {isOpen && (
          <Group>
            <InputText
              size="s"
              placeholder={`Buscar ${title}`}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={() => setIsOpen(false)}>
              {icons.operationModes.close}
            </Button>
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
          ) : null}
        </Body>
      ) : null}
    </Container>
  );
};
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
   
    z-index: 3;
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
    height: 200px;
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
        height: 2em;
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
   
    border: 1px solid rgba(0, 0, 0, 0);
    height: 1.6em;
    border-radius: 6px;
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