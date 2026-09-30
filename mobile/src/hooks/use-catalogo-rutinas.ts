import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import * as rutinasApi from '@/api/rutinas';
import type { Rutina } from '@/api/rutinas';

/**
 * Carga el catálogo de rutinas para las pantallas de Descubre: las del
 * gimnasio, las propias y "Elegido para ti" (las que la app le sugiere de
 * forma automática en su semana; si no hay, todas).
 */
export function useCatalogoRutinas() {
  const [cargando, setCargando] = useState(true);
  const [disponibles, setDisponibles] = useState<Rutina[]>([]);
  const [propias, setPropias] = useState<Rutina[]>([]);
  const [idsSugeridas, setIdsSugeridas] = useState<string[]>([]);

  const cargar = useCallback(async () => {
    try {
      const [todas, mias, plan] = await Promise.all([
        rutinasApi.listarRutinas(),
        rutinasApi.misRutinasPersonales(),
        rutinasApi.obtenerPlanSemana(),
      ]);
      setDisponibles(todas);
      setPropias(mias);
      const ids = plan.filter((d) => d.rutinaId && !d.fijadaPorCliente).map((d) => d.rutinaId as string);
      setIdsSugeridas([...new Set(ids)]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const sugeridas = disponibles.filter((r) => idsSugeridas.includes(r.id));
  const paraTi = sugeridas.length ? sugeridas : disponibles;

  return { cargando, disponibles, propias, paraTi, recargar: cargar };
}
