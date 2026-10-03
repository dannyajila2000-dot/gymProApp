import type { ReactNode } from 'react';
import { KeyboardAvoidingView, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Sube el contenido cuando aparece el teclado para que el campo que se escribe quede visible.
 * Con `behavior="padding"` en Android y en iOS: KeyboardAvoidingView mide cuánto tapa el teclado
 * a este contenedor, así que no suma espacio de más si el sistema ya redimensionó la ventana.
 * Úsalo como raíz de una pantalla con campos de texto, o como fondo de un Modal tipo hoja.
 */
export function ContenedorTeclado({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <KeyboardAvoidingView behavior="padding" style={[{ flex: 1 }, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}
