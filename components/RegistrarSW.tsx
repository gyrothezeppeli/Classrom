// components/RegistrarSW.tsx
"use client";

import { useEffect } from 'react';

export function RegistrarSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[SW] Registrado:', reg.scope))
        .catch((err) => console.error('[SW] Error:', err));
    }
  }, []);

  return null;
}