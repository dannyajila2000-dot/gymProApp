import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Recordatorio } from '@/api/recordatorios';

export async function pedirPermisoNotificaciones() {
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  const solicitado = await Notifications.requestPermissionsAsync();
  return solicitado.granted;
}

function crearTrigger(diaSemana: number, hora: number, minuto: number): Notifications.SchedulableNotificationTriggerInput {
  const weekday = diaSemana + 1; // expo-notifications usa 1=domingo

  if (Platform.OS === 'ios') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday,
      hour: hora,
      minute: minuto,
      repeats: true,
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday,
    hour: hora,
    minute: minuto,
  };
}

export async function sincronizarNotificaciones(recordatorios: Recordatorio[]) {
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
