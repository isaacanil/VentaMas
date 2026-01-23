import { Input } from 'antd';
import React from 'react';

interface UserCredentials {
  name: string;
  password: string;
}

interface BodyProps {
  user: UserCredentials;
  setUser: React.Dispatch<React.SetStateAction<UserCredentials>>;
}

export const Body = ({ user, setUser }: BodyProps) => {
  return (
    <div style={{ display: 'grid', gap: '0.8em' }}>
      <Input
        placeholder="Nombre de Usuario"
        value={user.name}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
        size="large"
        autoFocus
      />
      <Input.Password
        placeholder="Password"
        value={user.password}
        onChange={(e) => setUser({ ...user, password: e.target.value })}
        size="large"
      />
    </div>
  );
};
