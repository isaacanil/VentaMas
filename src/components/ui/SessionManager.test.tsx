import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SessionManager } from './SessionManager';

describe('SessionManager', () => {
  it('does not keep the loading text mounted after the session is ready', () => {
    render(<SessionManager status="ready" error={null} />);

    expect(screen.queryByText('Cargando sesión...')).not.toBeInTheDocument();
  });
});
