import { TypographyStyle } from './style/TypographyStyles';
import type { TypographyProps } from '@/types/ui';

const variantToComponentMap = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  label: 'label',
  l1: 'span',
  l2: 'span',
  l3: 'span',
  span: 'span',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};

const Typography = ({
  variant = 'body1',
  context = 'app',
  color = 'dark',
  align = 'left',
  display = 'block',
  gutterBottom = false,
  disableMargins = false,
  noWrap = false,
  component: ComponentProp,
  className,
  size = 'medium',
  italic = false,
  strikethrough = false,
  textShadow = null,
  children,
  bold = false,
  underline = false,
  uppercase = false,
  capitalize = false,
  lowercase = false,
  letterSpacing = 'normal',
  textTransform = 'none',
  ...rest
}: TypographyProps) => {
  const Component = ComponentProp || variantToComponentMap[variant] || 'span';
  return (
    <TypographyStyle
      as={Component}
      $context={context}
      $variant={variant}
      $color={color}
      $align={align}
      $display={display}
      $italic={italic}
      $gutterBottom={gutterBottom}
      $disableMargins={disableMargins}
      $strikethrough={strikethrough}
      $textShadow={textShadow}
      $size={size}
      $noWrap={noWrap}
      $underline={underline}
      $bold={bold}
      $uppercase={uppercase}
      $capitalize={capitalize}
      $lowercase={lowercase}
      $letterSpacing={letterSpacing}
      $textTransform={textTransform}
      className={className}
      {...rest}
    >
      {children}
    </TypographyStyle>
  );
};

export default Typography;
