import { useEffect, useRef, useState } from 'react';
import { Pedometer } from 'expo-sensors';
import type { EventSubscription } from 'expo-modules-core';

const UMBRAL_SINCRONIZACION = 20;

export function usePodometro(onNuevosPasos: (cantidad: number) => void) {
  const [disponible, setDisponible] = useState<boolean | null>(null);
  const [activo, setActivo] = useState(false);
  const [pasosSesion, setPasosSesion] = useState(0);
  const suscripcionRef = useRef<EventSubscription | null>(null);
  const pasosSesionRef = useRef(0);
  const ultimoSincronizadoRef = useRef(0);
  const onNuevosPasosRef = useRef(onNuevosPasos);
  onNuevosPasosRef.current = onNuevosPasos;

  useEffect(() => {
    Pedometer.isAvailableAsync()
      .then(setDisponible)
      .catch(() => setDisponible(false));
    return () => {
      suscripcionRef.current?.remove();
      sincronizarPendiente(pasosSesionRef.current);
    };
  }, []);

  function sincronizarPendiente(pasosActuales: number) {
    const pendiente = pasosActuales - ultimoSincronizadoRef.current;
    if (pendiente > 0) {
      ultimoSincronizadoRef.current = pasosActuales;
      onNuevosPasosRef.current(pendiente);
    }
  }

  async function iniciar() {
    const permiso = await Pedometer.requestPermissionsAsync();
    if (!permiso.granted) return false;

    setPasosSesion(0);
    pasosSesionRef.current = 0;
    ultimoSincronizadoRef.current = 0;
    suscripcionRef.current = Pedometer.watchStepCount((resultado) => {
      pasosSesionRef.current = resultado.steps;
      setPasosSesion(resultado.steps);
      if (resultado.steps - ultimoSincronizadoRef.current >= UMBRAL_SINCRONIZACION) {
        sincronizarPendiente(resultado.steps);
      }
    });
    setActivo(true);
    return true;
  }

  function detener() {
    suscripcionRef.current?.remove();
    suscripcionRef.current = null;
    sincronizarPendiente(pasosSesionRef.current);
    setActivo(false);
  }

  return { disponible, activo, pasosSesion, iniciar, detener };
}
