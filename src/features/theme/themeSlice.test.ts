import { afterEach, describe, expect, it, vi } from 'vitest';

const loadThemeSlice = () => import('./themeSlice');

describe('themeSlice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.resetModules();
  });

  it('initializes from the stored theme', async () => {
    localStorage.setItem('theme', 'dark');

    const { default: reducer } = await loadThemeSlice();

    expect(reducer(undefined, { type: 'unknown' })).toEqual({ mode: 'dark' });
  });

  it('toggles the theme and stores the new mode', async () => {
    const { default: reducer, toggleTheme } = await loadThemeSlice();

    const state = reducer({ mode: 'light' }, toggleTheme());

    expect(state.mode).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('setTheme stores the opposite mode while keeping the requested mode in state', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { default: reducer, setTheme } = await loadThemeSlice();

    const darkState = reducer({ mode: 'light' }, setTheme('dark'));

    expect(darkState.mode).toBe('dark');
    expect(setItemSpy).toHaveBeenLastCalledWith('theme', 'light');
    expect(localStorage.getItem('theme')).toBe('light');

    const lightState = reducer(darkState, setTheme('light'));

    expect(lightState.mode).toBe('light');
    expect(setItemSpy).toHaveBeenLastCalledWith('theme', 'dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
