// components/BotonNotificaciones.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { sileo } from 'sileo';

type EstadoNotif = 'cargando' | 'no-soportado' | 'denegado' | 'inactivo' | 'activo';

// ✅ Convertir la clave pública VAPID de base64url a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function BotonNotificaciones() {
  const [estado, setEstado] = useState<EstadoNotif>('cargando');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setEstado('no-soportado');
        return;
      }

      if (Notification.permission === 'denied') {
        setEstado('denegado');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setEstado(subscription ? 'activo' : 'inactivo');
      } catch {
        setEstado('inactivo');
      }
    };

    verificar();
  }, []);

  const activar = async () => {
    setCargando(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') {
        setEstado('denegado');
        sileo.error({
          title: 'Permiso denegado',
          description: 'Debes permitir las notificaciones en tu navegador',
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la suscripción');
      }

      setEstado('activo');
      sileo.success({
        title: '¡Notificaciones activadas!',
        description: 'Recibirás avisos de nuevas tareas y avisos',
      });
    } catch (error) {
      console.error('Error activando notificaciones:', error);
      sileo.error({
        title: 'Error al activar',
        description: 'Intenta de nuevo más tarde',
      });
    } finally {
      setCargando(false);
    }
  };

  const desactivar = async () => {
    setCargando(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch(
          `/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`,
          { method: 'DELETE' }
        );
        await subscription.unsubscribe();
      }

      setEstado('inactivo');
      sileo.success({ title: 'Notificaciones desactivadas' });
    } catch (error) {
      console.error('Error desactivando:', error);
    } finally {
      setCargando(false);
    }
  };

  // ============ RENDER ============
  if (estado === 'cargando') return null;

  if (estado === 'no-soportado') {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="text-white/40"
        title="Tu navegador no soporta notificaciones push"
      >
        <BellOff className="w-4 h-4" />
      </Button>
    );
  }

  if (estado === 'denegado') {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="text-red-400/60"
        title="Notificaciones bloqueadas. Actívalas en la configuración de tu navegador."
      >
        <BellOff className="w-4 h-4" />
      </Button>
    );
  }

  if (estado === 'activo') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={desactivar}
        disabled={cargando}
        className="text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-xl"
        title="Notificaciones activas. Click para desactivar."
      >
        <BellRing className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={activar}
      disabled={cargando}
      className="text-white/70 hover:text-white hover:bg-emerald-500/20 rounded-xl"
      title="Activar notificaciones"
    >
      <Bell className="w-4 h-4" />
      <span className="hidden sm:inline ml-2">
        {cargando ? 'Activando...' : 'Activar avisos'}
      </span>
    </Button>
  );
}