// Body.js
import React from 'react';
import styled from 'styled-components';

import { FilterPanel } from './components/FilterPanel/FilterPanel';
import { SortPanel } from './components/SortPanel/SortPanel';

export const Body = ({ }) => {
    return (
        <Container>
            <SectionsWrapper>
                <SortPanel />
                <Divider aria-hidden="true" />
                <FilterPanel />
            </SectionsWrapper>
        </Container>
    );
}

const Container = styled.div`
    display:grid;
    grid-template-rows:1fr;
    overflow:hidden;
`;

const SectionsWrapper = styled.div`
    overflow-y:auto;
    height:100%;
    padding:.9em .9em 1em;
    display:grid;
    gap:1.1em;
    align-content:start;
    scroll-behavior:smooth;
    &::-webkit-scrollbar{width:8px;}
    &::-webkit-scrollbar-track{background:transparent;}
    &::-webkit-scrollbar-thumb{background:#d0d0d0;border-radius:4px;}
  
`;

const Divider = styled.div`
    height:1px;
    width:100%;
    background:#e9e9e9;
`;

