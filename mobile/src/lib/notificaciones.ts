import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import type { Recordatorio } from '@/api/recordatorios';

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

export async function sincronizarNotificaciones(recordatorios: Recordatorio[]) {
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
          body: 'Tu rutina te está esperando.',
        },
        trigger: crearTrigger(dia, hora, minuto),
      });
    }
  }
}
