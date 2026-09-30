import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import * as recordatoriosApi from '@/api/recordatorios';
import type { Recordatorio } from '@/api/recordatorios';
import type { DiaPlan } from '@/api/rutinas';

// expo-notifications lanza un error al importarse en Android dentro de Expo Go
// (SDK 53+ removió el soporte de push ahí, y el módulo lo valida en su propio
// código de arranque). Evitamos requerirlo en ese entorno para no tumbar la app;
// en un development build o en iOS funciona normal.
const disponible = !(Platform.OS === 'android' && isRunningInExpoGo());

let Notifications: typeof import('expo-notifications') | null = null;
if (disponible) {
  // require condicional a propósito: un import estático siempre ejecutaría el
  // efecto de arranque del módulo (el que lanza el error) sin importar este if.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
}

export const notificacionesDisponibles = disponible;

export type EstadoPermisoNotificaciones = 'concedido' | 'denegado' | 'no_disponible';

export async function pedirPermisoNotificaciones(): Promise<EstadoPermisoNotificaciones> {
  if (!Notifications) return 'no_disponible';
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return 'concedido';
  const solicitado = await Notifications.requestPermissionsAsync();
  return solicitado.granted ? 'concedido' : 'denegado';
}

function crearTrigger(
  diaSemana: number,
  hora: number,
  minuto: number,
): import('expo-notifications').SchedulableNotificationTriggerInput {
  const weekday = diaSemana + 1; // expo-notifications usa 1=domingo

  if (Platform.OS === 'ios') {
    return {
      type: Notifications!.SchedulableTriggerInputTypes.CALENDAR,
      weekday,
      hour: hora,
      minute: minuto,
      repeats: true,
    };
  }

  return {
    type: Notifications!.SchedulableTriggerInputTypes.WEEKLY,
    weekday,
    hour: hora,
    minute: minuto,
  };
}

function mensajeDelDia(diaSemana: number, plan: DiaPlan[]) {
  const rutina = plan.find((d) => d.diaSemana === diaSemana)?.rutinaNombre;
  return rutina ? `Hoy toca: ${rutina}` : 'Tu rutina te está esperando.';
}

/**
 * Reprograma los recordatorios. Si se pasa el plan semanal, cada aviso dice la
 * rutina que toca ese día de la semana.
 */
export async function sincronizarNotificaciones(recordatorios: Recordatorio[], plan: DiaPlan[] = []) {
  if (!Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const activos = recordatorios.filter((r) => r.activo);
  for (const recordatorio of activos) {
    const [horaStr, minutoStr] = recordatorio.hora.split(':');
    const hora = Number(horaStr);
    const minuto = Number(minutoStr);

    for (const dia of recordatorio.diasSemana) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Hora de entrenar! 💪',
          body: mensajeDelDia(dia, plan),
        },
        trigger: crearTrigger(dia, hora, minuto),
      });
    }
  }
}

/**
 * Mantiene los avisos al día con el plan semanal (la rutina automática rota
 * cada semana y el usuario puede cambiarla). Se llama al abrir Inicio; no hace
 * nada si no hay recordatorios activos o falta el permiso.
 */
export async function resincronizarConPlan(plan: DiaPlan[]) {
  if (!Notifications) return;
  const permiso = await Notifications.getPermissionsAsync();
  if (!permiso.granted) return;
  const recordatorios = await recordatoriosApi.listarRecordatorios();
  if (!recordatorios.some((r) => r.activo)) return;
  await sincronizarNotificaciones(recordatorios, plan);
}
