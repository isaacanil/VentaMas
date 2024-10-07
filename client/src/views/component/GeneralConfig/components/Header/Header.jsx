import React from 'react';
import * as antd from 'antd';
import { useNavigate } from 'react-router-dom';
const { Button } = antd;
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';

// Styled Components para el Header
const HeaderContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 500;
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledButton = styled(Button)`
  display: flex;
  align-items: center;
  
  .anticon {
    margin-right: 4px;
  }
`;

export const Header = ({ title, onSave = null }) => {
    const navigate = useNavigate();
    const handleBack = () => {
        navigate(-1); // Navega hacia atrás en el historial
    };

    const handleSave = () => {
        if (onSave) {
            onSave();
        }
    };
    return (
        <HeaderContainer>
            <StyledButton type="link" onClick={handleBack}>
                <FontAwesomeIcon icon={faArrowLeft} /> Volver
            </StyledButton>
            <Title>{title}</Title>
            <Controls>
                {
                    onSave && (
                        <StyledButton type="primary" onClick={handleSave}>
                            <FontAwesomeIcon icon={faSave} /> Guardar
                        </StyledButton>
                    )
                }

            </Controls>
        </HeaderContainer>
    );
};


