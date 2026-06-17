import useViewportWidth from '@/hooks/useViewportWidth';

export function useWindowWidth(width = 800): boolean {
  const viewportWidth = useViewportWidth();
  return viewportWidth === 0 ? true : viewportWidth > width;
}
