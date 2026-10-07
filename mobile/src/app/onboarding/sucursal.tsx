import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ErrorApi } from '@/api/client';
import { listarSucursales, type Sucursal } from '@/api/clientes';
import { PasoOnboarding } from '@/components/onboarding/paso-onboarding';
import { TarjetaOpcion } from '@/components/onboarding/tarjeta-opcion';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

/**
 * Elegir a qué sucursal va a entrenar. Si el gimnasio tiene una sola (o ninguna) no hay nada que
 * elegir: la pantalla se salta sola y sigue con el cálculo de las rutinas.
 */
export default function ElegirSucursal() {
  const colors = useTheme();
  const { respuestas, actualizar } = useOnboarding();
  const [sucursales, setSucursales] = useState<Sucursal[] | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    listarSucursales()
      .then((lista) => {
        if (cancelado) return;
        if (lista.length <= 1) {
          actualizar({ sucursalId: lista[0]?.id ?? null, sucursalNombre: lista[0]?.nombre ?? null });
          router.replace('/onboarding/generando');
          return;
        }
        setSucursales(lista);
      })
      .catch((e) => {
        if (cancelado) return;
        // Un servidor que aún no conoce las sucursales (404) equivale a un gimnasio sin sucursales.
        if (e instanceof ErrorApi && e.status === 404) {
          actualizar({ sucursalId: null, sucursalNombre: null });
          router.replace('/onboarding/generando');
          return;
        }
        setError(true);
      });
    return () => {
      cancelado = true;
    };
    // `actualizar` cambia en cada render del proveedor; solo se vuelve a pedir la lista al reintentar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five, gap: Spacing.three, backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No pudimos cargar las sucursales. Revisa tu conexión.</Text>
        <Pressable onPress={() => { setError(false); setIntento((n) => n + 1); }} style={{ borderWidth: 1.5, borderColor: colors.tintFondo, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 }}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>Reintentar</Text>
        </Pressable>
        {/* Elegir sucursal es opcional: si no se puede cargar la lista, no debe impedir terminar el registro. */}
        <Pressable
          onPress={() => {
            actualizar({ sucursalId: null, sucursalNombre: null });
            router.replace('/onboarding/generando');
          }}
          style={{ paddingVertical: 12, paddingHorizontal: 24 }}>
          <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Continuar sin elegir sucursal</Text>
        </Pressable>
      </View>
    );
  }

  if (!sucursales) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <PasoOnboarding
      paso={12}
      titulo="¿A qué sucursal vas a entrenar?"
      textoBoton="CONTINUAR"
      desplazable
      deshabilitado={!respuestas.sucursalId}
      onSiguiente={() => router.push('/onboarding/generando')}>
      <View>
        {sucursales.map((sucursal) => (
          <TarjetaOpcion
            key={sucursal.id}
            icono="location-outline"
            titulo={sucursal.nombre}
            descripcion={sucursal.direccion ?? 'Sucursal'}
            seleccionado={respuestas.sucursalId === sucursal.id}
            onPress={() => actualizar({ sucursalId: sucursal.id, sucursalNombre: sucursal.nombre })}
          />
        ))}
      </View>
    </PasoOnboarding>
  );
}
