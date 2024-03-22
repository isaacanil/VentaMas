import styled from 'styled-components'

export const ImageGallery = ({ images = [] }) => {
    return (
      <GalleryContainer>
        {images.map((image, index) => (
          <Image key={index} src={image.img} alt={`Gallery image ${index + 1}`} />
        ))}
      </GalleryContainer>
    );
  };
  
  const GalleryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  padding: 16px;
`;

const Image = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: scale(1.05);
  }
`;
