import styled from 'styled-components';

export const ImageContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  overflow: hidden;
  border-radius: 5px;
`;

export const ImageContainer = styled.div`
  width: 100%;
  height: 100%;
`;

export const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
`;
