/**
 * Element the app's notifications render into. Normally the page, but while a modal dialog is open it is that
 * dialog: modals sit in the browser's top layer, above everything else, so notifications must live inside them.
 */
let host: HTMLElement | null = null;
const listeners = new Set<() => void>();

export const toastHost = {
  get: () => host,
  set: (element: HTMLElement | null) => {
    host = element;
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
