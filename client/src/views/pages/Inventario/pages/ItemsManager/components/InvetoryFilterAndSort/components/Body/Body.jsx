// Body.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { SubTitle } from '../../../../../../../checkout/Receipt';
import { FilterPanel } from './components/FilterPanel/FilterPanel';
import { SortPanel } from './components/SortPanel/SortPanel';

export const Body = ({ }) => {
    const [mode, setMode] = useState('ordenar');
    return (
        <Container>
            <OptionsContainer>
                <SubTitle>Opciones:</SubTitle>
                <OptionGroup
                    fillBtn
                >
                    <OptionLabel
                        selected={mode === 'ordenar'}
                        displayInput={'hidden'}
                        onClick={() => setMode('ordenar')}

                    >
                        <input type="radio" value="ordenar" checked={mode === 'ordenar'} onChange={() => setMode('ordenar')} />
                        Ordenar
                    </OptionLabel>
                    <OptionLabel

                        selected={mode === 'filtrar'}
                        displayInput={'hidden'}
                        onClick={() => setMode('filtrar')}
                    >
                        <input type="radio" value="filtrar" checked={mode === 'filtrar'} onChange={() => setMode('filtrar')} />
                        Filtrar
                    </OptionLabel>
                </OptionGroup>
            </OptionsContainer>
            <SectionsWrapper>
                {mode === 'ordenar' && (
                    <SortPanel
                        Label={OptionLabel}
                        Group={OptionGroup}
                    />
                )}
                {mode === 'filtrar' && (
                    <FilterPanel
                        Label={OptionLabel}
                        Group={OptionGroup}
                    />
                )}
            </SectionsWrapper>
        </Container>
    );
}
const Container = styled.div`
    display: grid;
    grid-template-rows: min-content 1fr;
    gap: 0.6em;
    overflow: hidden;
`
// Puedes reutilizar los estilos ya definidos si están en el mismo archivo, o importarlos si están en archivos separados.
const OptionsContainer = styled.div`
    padding: 0.4em;
`
const OptionGroup = styled.div`
  background-color: var(--color2);
  border-radius: var(--border-radius);
  padding: 0.6em;
  display: flex;
  flex-direction: ${props => (props.column ? 'column' : 'row')};
  gap: 0.4em;
  ${props => {
        if (props.fillBtn) return `
        padding: 0.2em;
            label{
                flex:1;
                justify-content: center; // Agrega esta línea
                text-align: center;
            }
        `
        if (props.column) return `
            label{
                width:100%;
            }
        `
        if (props.row) return `
            label{
                width:100%;
            }
        `
    }}
 
  ${props => {
        switch (props.themeColor) {
            case 'primary':
                return `
                background-color: var(--color1);
                color: var(--White);
                
            `
            case 'neutral':
                return `
                background-color: var(--color-neutral-light);
                color: var(--color-neutral-dark);
                
            `
        }
    }}
`;
const SectionsWrapper = styled.div`
    overflow: scroll;
    height: 100%;
    padding: 1em 0.4em;
    border-top: 1px solid #ccc;
`

const OptionLabel = styled.label`
    margin-right: 10px;
    display: flex;
    align-items: center;
    gap:1em;
    height: 2em;
    padding: 0 0.6em;
    background-color: ${props => (props.selected ? 'var(--color1)' : 'transparent')};
    border-radius: var(--border-radius);
    ${props => {
        if (props.displayInput === 'hidden') return `
            input{
                display:none;
            }
        `
    }}
    ${props => {
        switch (props.themeColor) {
            case 'primary':
                return `
                background-color: var(--color1);
                color: var(--White);
            `
            case 'neutral':
                return `
                background-color: ${props.selected ? `var(--color-neutral-dark)` : 'var(--color-neutral-light)'}};
                color: ${props.selected ? `var(--White)` : 'var(--color-neutral-dark)'}; // Corrección aquí
            `

        }
    }}
`;
