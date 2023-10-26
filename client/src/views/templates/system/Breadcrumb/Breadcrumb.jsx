import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const BreadcrumbContainer = styled.div`
    padding: 10px;
    width: min-content;
    white-space: nowrap;
    background-color: #f7f7f7;
    border-radius: 4px;
`;

const StyledLink = styled(Link)`
    text-decoration: none;
    color: #007bff;

    &:hover {
        text-decoration: underline;
    }
`;

export const Breadcrumb = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);

    return (
        <BreadcrumbContainer>
            <StyledLink to="/">Inicio</StyledLink>
            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isActive = location.pathname === to;
                return (
                    <span key={index}>
                        {' / '}
                        {!isActive ? <StyledLink to={to}>{value}</StyledLink> : value}
                    </span>
                );
            })}
        </BreadcrumbContainer>
    );
};


