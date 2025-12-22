import styled from 'styled-components';

export const CardList = ({
  maxWidth = 800,
  data = [],
  card: CardComponent = null,
}) => {
  const renderContent = () => {
    if (!CardComponent) {
      return null;
    }

    if (typeof CardComponent === 'function') {
      const Component = CardComponent;
      return data.map((item, index) => (
        <Component key={`${item?.id ?? index}`} item={item} index={index} />
      ));
    }

    return CardComponent;
  };

  return <Container $maxWidth={maxWidth}>{renderContent()}</Container>;
};

const Container = styled.div`
  width: 100%;
  max-width: ${(props) =>
    typeof props.$maxWidth === 'number'
      ? `${props.$maxWidth}px`
      : props.$maxWidth};
  height: 100%;
`;
