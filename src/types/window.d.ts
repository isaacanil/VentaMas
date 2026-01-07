export {};

declare global {
  interface Window {
    selectItem?: (index: number, event?: Event) => void;
    confirmSelection?: () => void;
  }
}
