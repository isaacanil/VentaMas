import { faUser, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Typography } from 'antd';

import {
  FullWidthSpace,
  UserAccessCard,
  UserSectionTitle,
} from './BusinessUserAccessSection.styles';

const { Text, Paragraph } = Typography;

interface BusinessUserAccessSectionProps {
  onAddUser: (event: React.MouseEvent<HTMLElement>) => void;
}

export const BusinessUserAccessSection = ({
  onAddUser,
}: BusinessUserAccessSectionProps) => (
  <section>
    <UserSectionTitle level={4}>
      <FontAwesomeIcon icon={faUser} /> Gestión de Usuarios
    </UserSectionTitle>
    <Paragraph>
      Administra los usuarios que tienen acceso a este negocio. Puedes agregar
      nuevos usuarios asignándoles diferentes roles y permisos.
    </Paragraph>
    <UserAccessCard>
      <FullWidthSpace orientation="vertical" size="middle">
        <Text>
          Agrega un nuevo usuario a este negocio para darle acceso al sistema.
        </Text>{' '}
        <Button
          type="primary"
          icon={<FontAwesomeIcon icon={faUserPlus} />}
          size="large"
          block
          onClick={onAddUser}
        >
          Agregar Usuario
        </Button>
      </FullWidthSpace>
    </UserAccessCard>
  </section>
);
