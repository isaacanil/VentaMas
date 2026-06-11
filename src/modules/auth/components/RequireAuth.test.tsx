import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import userReducer from '@/features/auth/userSlice';

import { RequireAuth } from './RequireAuth';

type AuthState = ReturnType<typeof userReducer>;

const createAuthState = (overrides: Partial<AuthState> = {}): AuthState => ({
  user: null,
  authReady: true,
  originalBusinessId: null,
  originalRole: null,
  ...overrides,
});

const renderGuard = (authState: AuthState) => {
  const store = configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: authState,
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <RequireAuth>
                <div>Contenido privado</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/" element={<div>Inicio</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe('RequireAuth', () => {
  it('redirects unauthenticated users to login instead of root', () => {
    renderGuard(createAuthState());

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });

  it('waits while auth is not ready', () => {
    const { container } = renderGuard(createAuthState({ authReady: false }));

    expect(container).toBeEmptyDOMElement();
  });

  it('renders children when the authenticated user is ready', () => {
    renderGuard(
      createAuthState({
        user: {
          id: 'user-1',
          name: 'Usuario de prueba',
          businessID: 'business-1',
          role: 'admin',
        },
      }),
    );

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });
});
