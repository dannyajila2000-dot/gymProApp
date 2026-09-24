import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function guardar(clave: string, valor: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(clave, valor);
    } catch (e) {
      console.error('localStorage no disponible:', e);
    }
    return;
  }
  await SecureStore.setItemAsync(clave, valor);
}

export async function leer(clave: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(clave);
    } catch (e) {
      console.error('localStorage no disponible:', e);
      return null;
    }
  }
  return SecureStore.getItemAsync(clave);
}

export async function eliminar(clave: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(clave);
    } catch (e) {
      console.error('localStorage no disponible:', e);
    }
    return;
  }
  await SecureStore.deleteItemAsync(clave);
}
