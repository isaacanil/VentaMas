import { Logo } from '@/assets/logo/Logo';

import {
  HeaderContainer,
  HeaderDescription,
  HeaderRow,
  HeaderTitle,
  TitleContainer,
} from './Header.styles';

interface HeaderProps {
  description?: string;
}

export const Header = ({
  description = 'Permite a un segundo usuario autorizar la apertura de la caja despues de una revision.',
}: HeaderProps) => {
  return (
    <HeaderContainer>
      <HeaderRow>
        <Logo size="small" />
        <TitleContainer>
          <HeaderTitle level={4}>Confirmacion de Usuario autorizado</HeaderTitle>
        </TitleContainer>
      </HeaderRow>
      <HeaderDescription type="secondary">
        {description}
      </HeaderDescription>
    </HeaderContainer>
  );
};
