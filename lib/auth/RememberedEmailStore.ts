export class RememberedEmailStore {
  subscribe = (callback: () => void): (() => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  };

  getSnapshot = (): string => {
    try {
      return window.localStorage.getItem('portal_remember_email') ?? '';
    } catch (error) {
      console.error('Error al leer localStorage:', error);
      return '';
    }
  };

  getServerSnapshot = (): string => '';
}
