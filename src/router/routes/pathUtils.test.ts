import { describe, expect, it } from 'vitest';

import {
  getLastRouteSegment,
  getRelativeRoutePath,
  joinRoutePath,
  stripLeadingSlash,
  stripTrailingSlash,
} from './pathUtils';

describe('route path utils', () => {
  it('normalizes route slashes without changing the root path', () => {
    expect(stripTrailingSlash('/settings/users/')).toBe('/settings/users');
    expect(stripTrailingSlash('/')).toBe('/');
    expect(stripTrailingSlash('')).toBe('');
    expect(stripLeadingSlash('/users')).toBe('users');
    expect(stripLeadingSlash('users')).toBe('users');
  });

  it('joins parent and child route paths consistently', () => {
    expect(joinRoutePath('/settings/', 'users')).toBe('/settings/users');
    expect(joinRoutePath('/settings', '/users')).toBe('/users');
    expect(joinRoutePath('/', 'users')).toBe('/users');
    expect(joinRoutePath('/settings', null)).toBe('/settings');
  });

  it('extracts relative and last route segments', () => {
    expect(getLastRouteSegment('/settings/users/')).toBe('users');
    expect(getRelativeRoutePath('/settings/users/list', '/settings')).toBe(
      'users/list',
    );
    expect(getRelativeRoutePath('/settings/users/list', '/settings/')).toBe(
      'users/list',
    );
  });
});
