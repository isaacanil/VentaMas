import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useBusinessFeatureEnabledMock } = vi.hoisted(() => ({
  useBusinessFeatureEnabledMock: vi.fn(),
}));

vi.mock('@/hooks/useBusinessFeatureEnabled', () => ({
  useBusinessFeatureAvailability: (...args: unknown[]) =>
    useBusinessFeatureEnabledMock(...args),
}));

import { BusinessFeatureRouteGate } from './BusinessFeatureRouteGate';

describe('BusinessFeatureRouteGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when the business feature is enabled', () => {
    useBusinessFeatureEnabledMock.mockReturnValue({
      enabled: true,
      resolved: true,
    });

    render(
      <MemoryRouter initialEntries={['/accounting']}>
        <Routes>
          <Route
            path="/accounting"
            element={
              <BusinessFeatureRouteGate
                feature="accounting"
                fallbackTo="/home"
              >
                <div>Accounting Workspace</div>
              </BusinessFeatureRouteGate>
            }
          />
          <Route path="/home" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Accounting Workspace')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('redirects to the fallback route when the business feature is disabled', () => {
    useBusinessFeatureEnabledMock.mockReturnValue({
      enabled: false,
      resolved: true,
    });

    render(
      <MemoryRouter initialEntries={['/accounting']}>
        <Routes>
          <Route
            path="/accounting"
            element={
              <BusinessFeatureRouteGate
                feature="accounting"
                fallbackTo="/home"
              >
                <div>Accounting Workspace</div>
              </BusinessFeatureRouteGate>
            }
          />
          <Route path="/home" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Accounting Workspace')).not.toBeInTheDocument();
  });

  it('waits for feature resolution before redirecting', () => {
    useBusinessFeatureEnabledMock.mockReturnValue({
      enabled: false,
      resolved: false,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/accounting']}>
        <Routes>
          <Route
            path="/accounting"
            element={
              <BusinessFeatureRouteGate
                feature="accounting"
                fallbackTo="/home"
              >
                <div>Accounting Workspace</div>
              </BusinessFeatureRouteGate>
            }
          />
          <Route path="/home" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Accounting Workspace')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
