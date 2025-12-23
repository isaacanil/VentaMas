import { faUserCog } from '@fortawesome/free-solid-svg-icons';
import { faExternalLink } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import { logout } from '@/features/auth/userSlice';
import { auth } from '@/firebase/firebaseconfig.jsx';
import { Button } from '@/views/templates/system/Button/Button';

import Style from './Account.module.scss';

export const Account = () => {
  const dispatch = useDispatch();
  const [isOpen, SetIsOpen] = useState(false);
  const OpenMenu = () => {
    SetIsOpen(!isOpen);
  };
  const logoutOfApp = () => {
    dispatch(logout());
    auth.signOut();
  };

  return (
    <div className={Style.Component_container} onClick={OpenMenu}>
      <Button
        color="gray-dark"
        borderRadius={'normal'}
        width={'icon32'}
        title={<FontAwesomeIcon icon={faUserCog} />}
      />
      <article
        className={
          !isOpen
            ? `${Style.AccountMenu}`
            : `${Style.AccountMenu} ${Style.Open}`
        }
      >
        <ul className={Style.Items}>
          <li className={Style.Item}>
            <Link to className={Style.Item_Link}>
              Cuenta
            </Link>{' '}
            <div className={Style.Icon_wrapper}>
              <FontAwesomeIcon icon={faExternalLink} />
            </div>
          </li>
          <li className={Style.Item}>
            <Link to className={Style.Item_Link}>
              Ayuda
            </Link>
            <div className={Style.Icon_wrapper}>
              <FontAwesomeIcon icon={faExternalLink} />
            </div>
          </li>

          <Button
            borderRadius={'normal'}
            title="Cerrar sesión"
            bgcolor="primary"
            width="100"
            onClick={logoutOfApp}
          />
        </ul>
      </article>
    </div>
  );
};
