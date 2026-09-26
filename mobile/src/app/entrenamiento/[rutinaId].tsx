import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Speech from 'expo-speech';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorApi } from '@/api/client';
import { useTheme } from '@/hooks/use-theme';
import { useSesion } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';
import * as rutinasApi from '@/api/rutinas';
import type { Rutina, RutinaEjercicio } from '@/api/rutinas';
import { MunecoEjercicio } from '@/components/muneco-ejercicio';
import { DetalleEjercicioModal } from '@/components/entrenamiento/detalle-ejercicio-modal';
import { obtenerPistaGuardada } from '@/lib/musica';
import { caloriasEstimadas } from '@/lib/rutina-utils';

type Paso =
  | { tipo: 'ejercicio'; item: RutinaEjercicio; serie: number; totalSeries: number }
  | { tipo: 'descanso'; duracionSeg: number };

function construirPasos(rutina: Rutina): Paso[] {
  const pasos: Paso[] = [];
  rutina.ejercicios.forEach((item) => {
    const totalSeries = item.series ?? 1;
    for (let serie = 1; serie <= totalSeries; serie++) {
      pasos.push({ tipo: 'ejercicio', item, serie, totalSeries });
      if (item.descansoSeg && serie < totalSeries) {
        pasos.push({ tipo: 'descanso', duracionSeg: item.descansoSeg });
      }
    }
  });
  return pasos;
}

function Temporizador({
  duracion,
  color,
  onTerminar,
  pausado = false,
}: {
  duracion: number;
  color: string;
  onTerminar: () => void;
  pausado?: boolean;
}) {
  const [restante, setRestante] = useState(duracion);
  const onTerminarRef = useRef(onTerminar);

  useEffect(() => {
    onTerminarRef.current = onTerminar;
  }, [onTerminar]);

  useEffect(() => {
    if (pausado) return;
    let timeoutFinal: ReturnType<typeof setTimeout> | null = null;
    const intervalo = setInterval(() => {
      setRestante((actual) => {
        if (actual <= 1) {
          clearInterval(intervalo);
          timeoutFinal = setTimeout(() => onTerminarRef.current(), 300);
          return 0;
        }
        return actual - 1;
      });
    }, 1000);
    return () => {
      clearInterval(intervalo);
      if (timeoutFinal) clearTimeout(timeoutFinal);
    };
  }, [pausado]);

  return <Text style={[styles.temporizador, { color }]}>{restante}s</Text>;
}

export default function Entrenamiento() {
  const colors = useTheme();
  const { cliente } = useSesion();
  const { rutinaId } = useLocalSearchParams<{ rutinaId: string }>();
  const guiaDeVozActiva = cliente?.guiaDeVozActiva !== false;
  const cuentaAtrasSeg = cliente?.cuentaAtrasSeg ?? 5;
  const volumenMusica = cliente?.volumenMusica ?? 0.5;
  const bajarVolumenConVoz = cliente?.bajarVolumenConVoz !== false;

  const [pistaUri, setPistaUri] = useState<string | null>(null);
  const musica = useAudioPlayer(pistaUri ? { uri: pistaUri } : null);

  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pasoActual, setPasoActual] = useState(0);
  const [finalizado, setFinalizado] = useState<{ duracionMin: number; caloriasEstimadas: number } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [reintentos, setReintentos] = useState(0);
  const [enPreparacion, setEnPreparacion] = useState(cuentaAtrasSeg > 0);
  const [pausado, setPausado] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const inicioRef = useRef<number>(0);

  useEffect(() => {
    let cancelado = false;
    rutinasApi
      .obtenerMiRutina()
      .then((mia) => {
        if (cancelado) return;
        setRutina(mia && mia.id === rutinaId ? mia : null);
        inicioRef.current = Date.now();
      })
      .catch((e) => {
        if (cancelado) return;
        setError(e instanceof ErrorApi ? e.message : 'No pudimos cargar esta rutina');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [rutinaId, reintentos]);

  const pasos = useMemo(() => (rutina ? construirPasos(rutina) : []), [rutina]);
  const paso = pasos[pasoActual];

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
    obtenerPistaGuardada().then((pista) => setPistaUri(pista?.uri ?? null));
  }, []);

  useEffect(() => {
    if (!pistaUri) return;
    // expo-audio expone un objeto mutable a propósito: así se controla el player.
    // eslint-disable-next-line react-hooks/immutability
    musica.loop = true;
    musica.volume = volumenMusica;
    if (!finalizado) musica.play();
    return () => {
      musica.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pistaUri]);

  useEffect(() => {
    if (!pistaUri) return;
    if (finalizado) musica.pause();
  }, [finalizado, pistaUri, musica]);

  useEffect(() => {
    if (!pistaUri) return;
    // eslint-disable-next-line react-hooks/immutability
    musica.volume = volumenMusica;
  }, [volumenMusica, pistaUri, musica]);

  function opcionesVoz() {
    return {
      language: 'es',
      onStart: () => {
        if (pistaUri && bajarVolumenConVoz) musica.volume = Math.min(volumenMusica, 0.15);
      },
      onDone: () => {
        if (pistaUri && bajarVolumenConVoz) musica.volume = volumenMusica;
      },
      onStopped: () => {
        if (pistaUri && bajarVolumenConVoz) musica.volume = volumenMusica;
      },
      onError: () => {
        if (pistaUri && bajarVolumenConVoz) musica.volume = volumenMusica;
      },
    };
  }

  useEffect(() => {
    if (rutina && enPreparacion && guiaDeVozActiva && cuentaAtrasSeg > 0) {
      Speech.speak('Prepárate', opcionesVoz());
    }
    // Solo debe anunciarse una vez, cuando la rutina termina de cargar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!rutina]);

  useEffect(() => {
    if (enPreparacion || !guiaDeVozActiva || !paso) return;
    Speech.stop();
    const texto = paso.tipo === 'descanso' ? 'Descanso' : paso.item.ejercicio.nombre;
    Speech.speak(texto, opcionesVoz());
    return () => {
      Speech.stop();
    };
    // Solo debe anunciar cuando cambia el paso, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoActual, enPreparacion]);

  useEffect(() => {
    if (finalizado && guiaDeVozActiva) Speech.speak('¡Entrenamiento completado!', opcionesVoz());
    // opcionesVoz se recrea en cada render; no debe disparar este efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalizado, guiaDeVozActiva]);

  function quitarPausa() {
    setPausado((actual) => {
      if (actual && pistaUri) musica.play();
      return false;
    });
  }

  async function avanzar() {
    quitarPausa();
    if (pasoActual + 1 >= pasos.length) {
      await finalizar();
    } else {
      setPasoActual((i) => i + 1);
    }
  }

  function retroceder() {
    if (pasoActual === 0) return;
    quitarPausa();
    setPasoActual((i) => i - 1);
  }

  function alternarPausa() {
    setPausado((actual) => {
      const nuevo = !actual;
      if (pistaUri) {
        if (nuevo) musica.pause();
        else musica.play();
      }
      if (nuevo) Speech.stop();
      return nuevo;
    });
  }

  function saltar() {
    if (paso?.tipo === 'ejercicio' && !duracionPaso) {
      Alert.alert('¿Saltar este ejercicio?', 'No se marcará como completado.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Saltar', style: 'destructive', onPress: () => avanzar() },
      ]);
    } else {
      avanzar();
    }
  }

  async function finalizar() {
    if (!rutina) return;
    const duracionMin = Math.max(1, Math.round((Date.now() - inicioRef.current) / 60000));
    const calorias = caloriasEstimadas(rutina);

    setGuardando(true);
    try {
      await rutinasApi.registrarSesion({
        rutinaId: rutina.id,
        duracionMin,
        caloriasEstimadas: calorias,
      });
    } finally {
      setGuardando(false);
      setFinalizado({ duracionMin, caloriasEstimadas: calorias });
    }
  }

  if (cargando) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background, gap: Spacing.two }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{error}</Text>
        <Pressable
          onPress={() => {
            setCargando(true);
            setError(null);
            setReintentos((n) => n + 1);
          }}
          style={{ marginTop: Spacing.one }}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>Reintentar</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (!rutina) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No encontramos esta rutina.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.three }}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (finalizado) {
    return (
      <View style={[styles.centro, { backgroundColor: colors.background, gap: Spacing.two }]}>
        <Ionicons name="checkmark-circle" size={72} color={colors.tint} />
        <Text style={[styles.tituloFinal, { color: colors.text }]}>¡Entrenamiento completado!</Text>
        <Text style={{ color: colors.textSecondary }}>{rutina.nombre}</Text>
        <View style={[styles.resumenFila, { marginTop: Spacing.three }]}>
          <View style={[styles.resumenTarjeta, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.resumenValor, { color: colors.text }]}>{finalizado.duracionMin}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>minutos</Text>
          </View>
          <View style={[styles.resumenTarjeta, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.resumenValor, { color: colors.text }]}>{finalizado.caloriasEstimadas}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>kcal estimadas</Text>
          </View>
        </View>
        <Pressable
          style={[styles.botonPrincipal, { backgroundColor: colors.tint, marginTop: Spacing.four }]}
          onPress={() => router.replace('/(tabs)/rutina')}>
          <Text style={[styles.botonPrincipalTexto, { color: colors.tintForeground }]}>Volver a rutina</Text>
        </Pressable>
      </View>
    );
  }

  if (enPreparacion) {
    const primerPaso = pasos[0];
    const nombrePrimerEjercicio = primerPaso?.tipo === 'ejercicio' ? primerPaso.item.ejercicio.nombre : '';
    return (
      <View style={[styles.centro, { backgroundColor: colors.background, gap: Spacing.two }]}>
        <Text style={[styles.etiquetaFase, { color: colors.tint }]}>PREPÁRATE</Text>
        <Temporizador
          duracion={cuentaAtrasSeg}
          color={colors.text}
          onTerminar={() => setEnPreparacion(false)}
        />
        {!!nombrePrimerEjercicio && (
          <Text style={{ color: colors.textSecondary, marginTop: Spacing.two }}>
            Primero: {nombrePrimerEjercicio}
          </Text>
        )}
      </View>
    );
  }

  if (!paso) return null;

  const progreso = (pasoActual + 1) / pasos.length;
  const duracionPaso = paso.tipo === 'descanso' ? paso.duracionSeg : paso.item.duracionSeg;

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.background }]}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
          {pasoActual + 1} / {pasos.length}
        </Text>
      </View>

      <View style={[styles.barraProgreso, { backgroundColor: colors.border }]}>
        <View style={[styles.barraProgresoRelleno, { backgroundColor: colors.tint, width: `${progreso * 100}%` }]} />
      </View>

      {paso.tipo === 'descanso' ? (
        <View style={styles.centroFlex}>
          <Text style={[styles.etiquetaFase, { color: colors.tint }]}>DESCANSO</Text>
          <Temporizador
            key={pasoActual}
            duracion={paso.duracionSeg}
            color={colors.text}
            onTerminar={avanzar}
            pausado={pausado}
          />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.centroScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.etiquetaFase, { color: colors.tint }]}>
            SERIE {paso.serie} DE {paso.totalSeries}
          </Text>

          <View style={[styles.fotoContenedor, { backgroundColor: colors.backgroundElement }]}>
            {cliente?.preferenciaEntrenador !== 'animacion' && paso.item.ejercicio.gifUrl ? (
              <Image source={{ uri: paso.item.ejercicio.gifUrl }} style={styles.foto} contentFit="cover" />
            ) : (
              <MunecoEjercicio patron={paso.item.ejercicio.patronMovimiento} color={colors.tint} size={140} />
            )}
            <View style={[styles.munecoInsignia, { backgroundColor: colors.background, borderColor: colors.background }]}>
              <MunecoEjercicio patron={paso.item.ejercicio.patronMovimiento} color={colors.tint} size={44} />
            </View>
          </View>

          <View style={styles.filaNombre}>
            <Text style={[styles.nombreEjercicio, { color: colors.text }]}>{paso.item.ejercicio.nombre}</Text>
            <Pressable onPress={() => setModalDetalle(true)} hitSlop={8}>
              <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={{ color: colors.textSecondary, marginBottom: Spacing.two }}>
            {paso.item.ejercicio.grupoMuscular}
          </Text>
          {paso.item.ejercicio.descripcion && (
            <Text style={[styles.descripcion, { color: colors.textSecondary }]}>
              {paso.item.ejercicio.descripcion}
            </Text>
          )}

          {duracionPaso ? (
            <Temporizador
              key={pasoActual}
              duracion={duracionPaso}
              color={colors.text}
              onTerminar={avanzar}
              pausado={pausado}
            />
          ) : (
            <Text style={[styles.repeticiones, { color: colors.text }]}>{paso.item.repeticiones} reps</Text>
          )}
        </ScrollView>
      )}

      <View style={{ gap: Spacing.two }}>
        {!!duracionPaso && (
          <Pressable style={[styles.botonPrincipal, { backgroundColor: colors.tint }]} onPress={alternarPausa}>
            <Text style={[styles.botonPrincipalTexto, { color: colors.tintForeground }]}>
              {pausado ? '▶ Reanudar' : '⏸ Pausa'}
            </Text>
          </Pressable>
        )}
        {paso.tipo === 'ejercicio' && !duracionPaso && (
          <Pressable
            style={[styles.botonPrincipal, { backgroundColor: colors.tint }]}
            onPress={avanzar}
            disabled={guardando}>
            <Text style={[styles.botonPrincipalTexto, { color: colors.tintForeground }]}>
              {guardando ? 'Guardando...' : 'Marcar como completado'}
            </Text>
          </Pressable>
        )}

        <View style={styles.filaNav}>
          <Pressable onPress={retroceder} disabled={pasoActual === 0} hitSlop={8}>
            <Text style={{ color: colors.textSecondary, fontWeight: '700', opacity: pasoActual === 0 ? 0.35 : 1 }}>
              Anterior
            </Text>
          </Pressable>
          <Pressable onPress={saltar} hitSlop={8}>
            <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Saltar</Text>
          </Pressable>
        </View>
      </View>

      {paso.tipo === 'ejercicio' && (
        <DetalleEjercicioModal
          visible={modalDetalle}
          onCerrar={() => setModalDetalle(false)}
          ejercicio={paso.item.ejercicio}
          mostrarVideo={cliente?.preferenciaEntrenador !== 'animacion'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  centroFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  centroScroll: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  fotoContenedor: {
    width: 190,
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  munecoInsignia: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descripcion: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.three,
  },
  contenedor: {
    flex: 1,
    padding: Spacing.four,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  barraProgreso: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barraProgresoRelleno: {
    height: 6,
    borderRadius: 3,
  },
  etiquetaFase: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: Spacing.two,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  nombreEjercicio: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  filaNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.one,
  },
  temporizador: {
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  repeticiones: {
    fontSize: 44,
    fontWeight: '800',
  },
  botonPrincipal: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botonPrincipalTexto: {
    fontSize: 16,
    fontWeight: '800',
  },
  tituloFinal: {
    fontSize: 22,
    fontWeight: '800',
  },
  resumenFila: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  resumenTarjeta: {
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
    minWidth: 110,
  },
  resumenValor: {
    fontSize: 24,
    fontWeight: '800',
  },
});
