/* utils/stockTheme.js */
export const productColorThemes = {
  default: {
    textColor: 'var(--color)',
    amountColor: '#757575',
    outlineSelected: '2.9px solid var(--color)',
  },
  lowStock: {
    textColor: '#fb8c00',
    amountColor: '#fb8c00',
    outlineSelected: '2.9px solid #fb8c00',
  },
  critical: {
    textColor: '#ff7043',
    amountColor: '#ff7043',
    outlineSelected: '2.9px solid #ff7043',
  },
  strict: {
    textColor: '#43a047',
    amountColor: '#43a047',
    outlineSelected: '2.9px solid #43a047',
  },
};

export const getProductTheme = (props) => {
  const isOutOfStock = props.isOutOfStock || props.$isOutOfStock;
  const isCriticalStock = props.isCriticalStock || props.$isCriticalStock;
  const isLowStock = props.isLowStock || props.$isLowStock;
  const hasStrictStock = props.hasStrictStock || props.$hasStrictStock;
  const isSelected = props.isSelected || props.$isSelected;

  if (isOutOfStock) {
    return {
      textColor: isSelected ? '#ef5350' : '#9e9e9e',
      amountColor: isSelected ? '#ef5350' : '#9e9e9e',
      outlineSelected: isSelected ? '2.9px solid #ef5350' : 'none',
    };
  }
  if (isCriticalStock) return productColorThemes.critical;
  if (isLowStock) return productColorThemes.lowStock;
  if (hasStrictStock) return productColorThemes.strict;
  return productColorThemes.default;
};

export const getContainerOutline = (props) => {
  const isSelected = props.isSelected || props.$isSelected;
  return isSelected ? getProductTheme(props).outlineSelected : 'none';
};

export const getAmountColor = (props) => getProductTheme(props).amountColor;
export const getPriceColor = (props) => getProductTheme(props).textColor;
export const getAmountBackground = () => '#f5f5f5';
