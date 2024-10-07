// src/components/SearchBar.jsx
import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import Input from '../Input/Input';


const SearchBarWrapper = styled.div`
  position: relative;
`;

const StyledIcon = styled(FontAwesomeIcon)`
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280; /* text-muted-foreground */
  height: 1rem;
  width: 1rem;
`;

const StyledInput = styled(Input)`
  padding-left: 2rem; /* pl-8 */
`;

const SearchBar = ({ searchTerm, onSearch }) => {
  const handleChange = (e) => {
    onSearch(e.target.value);
  };

  return (
    <SearchBarWrapper>
      <StyledIcon icon={faSearch} />
      <StyledInput
        type="text"
        placeholder="Buscar por cliente, ID o artículo..."
        value={searchTerm}
        onChange={handleChange}
      />
    </SearchBarWrapper>
  );
};

export default SearchBar;
