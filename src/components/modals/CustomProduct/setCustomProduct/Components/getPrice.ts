// @ts-nocheck
export const getPrice = ({ productSelected, setProduct, isComplete }) => {
  const a = productSelected.a ? JSON.parse(productSelected.a) : {};
  const b = productSelected.b ? JSON.parse(productSelected.b) : {};

  const firstProductPrice = a?.pricing?.price || '';
  const secondProductPrice = b?.pricing?.price || '';

  const complete = isComplete === 'complete';
  const half = isComplete === 'half';

  switch (true) {
    case complete && firstProductPrice:
      setProduct({
        pricing: {
          price: firstProductPrice,
        },
      });
      return firstProductPrice;
    case half && firstProductPrice > secondProductPrice:
      setProduct({
        pricing: {
          price: firstProductPrice,
        },
      });
      return firstProductPrice;
    case half && firstProductPrice < secondProductPrice:
      setProduct({
        pricing: {
          price: secondProductPrice,
        },
      });
      return secondProductPrice;
    case half && firstProductPrice === secondProductPrice:
      setProduct({
        pricing: {
          price: firstProductPrice,
        },
      });
      return firstProductPrice;
    default:
      setProduct({
        pricing: {
          price: firstProductPrice,
        },
      });
      return firstProductPrice;
  }
};
