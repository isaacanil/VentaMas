import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const NameContainer = styled.div`
 margin-left: 8px;
   white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
 flex: 1;
  min-width: 0;
  /* background-color: black; */
  padding-right: 8px;
`;
// const NodeName = styled.span`
//   margin-left: 8px;
//   white-space: nowrap;
//   overflow: hidden;
//   text-overflow: ellipsis;
//   flex: 1;
//   min-width: 0;
//   padding-right: 8px;
// `;
const NodeName = ({
    title,
    isMatch,
    children,
    isLoading,
    searchTerm,
    config,
    matchedStockCount,
    renderHighlightedText
}) => {
    const renderContent = () => {
        if (isLoading) {
            return 'Cargando';
        }

        if (searchTerm) {
            return renderHighlightedText(title, searchTerm);
        }

        return title;
    };

    const renderMatchCount = () => {
        if (!config?.showMatchedStockCount || !matchedStockCount) {
            return null;
        }

        return ` (${matchedStockCount} producto(s) encontrado(s))`;
    };

    return (
        <NameContainer
            title={title}
            isMatch={isMatch}
        >
            {renderContent()}
            {renderMatchCount()}
        </NameContainer>
    );
};

NodeName.propTypes = {
    title: PropTypes.string.isRequired,
    isMatch: PropTypes.bool,
    children: PropTypes.node,
    isLoading: PropTypes.bool,
    searchTerm: PropTypes.string,
    config: PropTypes.object,
    matchedStockCount: PropTypes.number,
    renderHighlightedText: PropTypes.func
};

NodeName.defaultProps = {
    isMatch: false,
    isLoading: false,
    matchedStockCount: 0
};

export default NodeName;