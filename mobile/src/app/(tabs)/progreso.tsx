import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ErrorApi } from '@/api/client';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { useSesion } from '@/context/auth-context';
import * as progresoApi from '@/api/progreso';
import type { RegistroProgreso, ResumenHoy, ResumenSemana } from '@/api/progreso';
import * as clientesApi from '@/api/clientes';
import { calcularImc, categoriaImc } from '@/lib/imc';
import { CATALOGO_ACTIVIDADES } from '@/lib/actividades-catalogo';
import { ReglaHorizontal } from '@/components/onboarding/regla-horizontal';
import { usePodometro } from '@/hooks/use-podometro';
import { AnilloDoble, AnilloSimple } from '@/components/seguimiento/anillo-doble';
import { GraficaBarras } from '@/components/seguimiento/grafica-barras';
import { GraficaLinea } from '@/components/seguimiento/grafica-linea';
import { BarraImc } from '@/components/seguimiento/barra-imc';

const OBJETIVO_LABEL: Record<string, string> = {
  perdida_grasa: 'pérdida de grasa',
  fuerza: 'fuerza',
  cuerpo_completo: 'cuerpo completo',
  tren_superior: 'tren superior',
  tren_inferior: 'tren inferior',
  cardio: 'cardio',
  core: 'core',
};

const TABS = [
  { clave: 'resumen', etiqueta: 'Resumen' },
  { clave: 'hoy', etiqueta: 'Hoy' },
  { clave: 'peso', etiqueta: 'Peso' },
] as const;

type Tab = (typeof TABS)[number]['clave'];

export default function Progreso() {
  const colors = useTheme();
  const [tab, setTab] = useState<Tab>('hoy');

  return (
    <View style={[styles.pantalla, { backgroundColor: colors.background }]}>
      <Text style={[styles.titulo, { color: colors.text }]}>Progreso</Text>

      <View style={[styles.tabs, { borderColor: colors.border }]}>
        {TABS.map((t) => (
          <Pressable key={t.clave} onPress={() => setTab(t.clave)} style={styles.tabBoton}>
            <Text style={{ color: tab === t.clave ? colors.tint : colors.textSecondary, fontWeight: '700' }}>
              {t.etiqueta}
            </Text>
            {tab === t.clave && <View style={[styles.tabSubrayado, { backgroundColor: colors.tint }]} />}
          </Pressable>
        ))}
      </View>

      {tab === 'resumen' && <TabResumen />}
      {tab === 'hoy' && <TabHoy />}
      {tab === 'peso' && <TabPeso />}
    </View>
  );
}

// ---------- RESUMEN ----------

const DIAS_CORTOS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function TabResumen() {
  const colors = useTheme();
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [resumen, setResumen] = useState<ResumenSemana | null>(null);

  const cargar = useCallback(async () => {
    try {
      const datos = await progresoApi.resumenDeLaSemana();
      setResumen(datos);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (cargando || !resumen) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const hoyIndice = new Date().getDay();

  return (
    <ScrollView
      contentContainerStyle={styles.contenidoTab}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => {
            setRefrescando(true);
            cargar();
          }}
          tintColor={colors.tint}
        />
      }>
      <View style={styles.filaTarjetas}>
        <TarjetaStat valor={resumen.entrenamientos} etiqueta="Entrenamientos" />
        <TarjetaStat valor={resumen.caloriasTotales} etiqueta="Kcal totales" />
        <TarjetaStat valor={resumen.minutosTotales} etiqueta="Minutos" />
      </View>

      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: Spacing.two }}>
          ESTA SEMANA
        </Text>
        <View style={styles.filaCalendario}>
          {DIAS_CORTOS.map((dia, i) => {
            const completado = resumen.diasCompletados.includes(i);
            const esHoy = i === hoyIndice;
            return (
              <View key={i} style={styles.diaCalendario}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>{dia}</Text>
                <View
                  style={[
                    styles.circuloDia,
                    {
                      backgroundColor: completado ? colors.tint : colors.backgroundSelected,
                      borderColor: esHoy ? colors.tint : 'transparent',
                    },
                  ]}>
                  {completado && <Ionicons name="checkmark" size={14} color={colors.tintForeground} />}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement, flexDirection: 'row', alignItems: 'center', gap: Spacing.two }]}>
        <Ionicons name="flame" size={26} color={colors.tint} />
        <View>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>Racha de {resumen.racha} días</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Sigue así para no perderla</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function TarjetaStat({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const colors = useTheme();
  return (
    <View style={[styles.tarjeta, { flex: 1, backgroundColor: colors.backgroundElement, alignItems: 'center' }]}>
      <Text style={[styles.valorGrande, { color: colors.text }]}>{valor}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center' }}>{etiqueta}</Text>
    </View>
  );
}

// ---------- HOY ----------

const PRESETS_META = [
  { nombre: 'Mantenerse activo', calorias: 200, minutos: 20 },
  { nombre: 'Mantenerme en forma', calorias: 400, minutos: 30 },
  { nombre: 'Tonificación', calorias: 500, minutos: 40 },
  { nombre: 'Quema grasa', calorias: 600, minutos: 45 },
];

function TabHoy() {
  const colors = useTheme();
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [resumen, setResumen] = useState<ResumenHoy | null>(null);
  const [actividades, setActividades] = useState<progresoApi.ActividadLibre[]>([]);
  const [pasosSemana, setPasosSemana] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  const [modalMeta, setModalMeta] = useState(false);
  const [modalPasos, setModalPasos] = useState(false);
  const [modalActividad, setModalActividad] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [r, act, semanaPasos] = await Promise.all([
        progresoApi.resumenDeHoy(),
        progresoApi.listarActividades(),
        progresoApi.pasosPorSemana(),
      ]);
      setResumen(r);
      setActividades(act.filter((a) => a.fecha.slice(0, 10) === new Date().toISOString().slice(0, 10)));
      setPasosSemana(semanaPasos);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function desbloquearPasos() {
    await progresoApi.actualizarMetaSeguimiento({ pasosActivo: true });
    await cargar();
  }

  async function eliminarActividad(id: string) {
    await progresoApi.eliminarActividad(id);
    setActividades((actual) => actual.filter((a) => a.id !== id));
  }

  if (cargando || !resumen) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const progresoCalorias = resumen.caloriasQuemadas / resumen.meta.caloriasQuemarObjetivo;
  const progresoDuracion = resumen.duracionMin / resumen.meta.duracionObjetivoMin;
  const progresoPasos = resumen.pasos / resumen.meta.pasosObjetivo;

  return (
    <ScrollView
      contentContainerStyle={styles.contenidoTab}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => {
            setRefrescando(true);
            cargar();
          }}
          tintColor={colors.tint}
        />
      }>
      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.filaEntreItems}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>Objetivo diario</Text>
          <Pressable onPress={() => setModalMeta(true)}>
            <Ionicons name="pencil" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.filaAnillo}>
          <AnilloDoble
            size={130}
            progresoExterior={progresoCalorias}
            progresoInterior={progresoDuracion}
            colorExterior={colors.tint}
            colorInterior={colors.info}
            colorFondo={colors.backgroundSelected}
          />
          <View style={{ gap: Spacing.two }}>
            <LeyendaAnillo color={colors.tint} valor={`${resumen.caloriasQuemadas}/${resumen.meta.caloriasQuemarObjetivo}`} etiqueta="Kcal" />
            <LeyendaAnillo color={colors.info} valor={`${resumen.duracionMin}/${resumen.meta.duracionObjetivoMin}`} etiqueta="Minutos" />
          </View>
        </View>
      </View>

      <Text style={[styles.seccionTitulo, { color: colors.text }]}>Seguimiento de salud</Text>
      <View style={styles.filaTarjetas}>
        <View style={[styles.tarjeta, { flex: 1, backgroundColor: colors.backgroundElement, alignItems: 'center' }]}>
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.two }}>Pasos</Text>
          {resumen.meta.pasosActivo ? (
            <>
              <AnilloSimple size={90} progreso={progresoPasos} color={colors.tint} colorFondo={colors.backgroundSelected}>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="footsteps" size={16} color={colors.tint} />
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>{resumen.pasos}</Text>
                </View>
              </AnilloSimple>
              <Pressable onPress={() => setModalPasos(true)} style={{ marginTop: Spacing.two }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Detalles</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={desbloquearPasos}
              style={[styles.pildoraDesbloqueo, { backgroundColor: colors.tint, marginTop: Spacing.three }]}>
              <Ionicons name="lock-closed" size={13} color={colors.tintForeground} />
              <Text style={{ color: colors.tintForeground, fontWeight: '700', fontSize: 12 }}>Desbloquear</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.tarjeta, { flex: 1, backgroundColor: colors.backgroundElement, alignItems: 'center' }]}>
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.two }}>Agua</Text>
          <Ionicons name="water" size={40} color={colors.info} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: Spacing.two, textAlign: 'center' }}>
            Ve a la pestaña Nutrición
          </Text>
        </View>
      </View>

      <View style={styles.filaEntreItems}>
        <Text style={[styles.seccionTitulo, { color: colors.text }]}>Actividad libre</Text>
        <Pressable onPress={() => setModalActividad(true)} style={[styles.botonAgregar, { backgroundColor: colors.tint }]}>
          <Ionicons name="add" size={18} color={colors.tintForeground} />
        </Pressable>
      </View>
      <View style={{ gap: Spacing.two }}>
        {actividades.map((a) => (
          <View key={a.id} style={[styles.filaActividad, { borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{a.nombre}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {a.duracionMin} min{a.distanciaM ? ` · ${(a.distanciaM / 1000).toFixed(1)} km` : ''} ·{' '}
                {Math.round(a.caloriasEstimadas)} kcal
              </Text>
            </View>
            <Pressable onPress={() => eliminarActividad(a.id)}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
        ))}
        {actividades.length === 0 && (
          <Text style={{ color: colors.textSecondary }}>
            No has añadido actividad libre hoy. Toca “+” para registrar una.
          </Text>
        )}
      </View>

      <ModalMetaDiaria visible={modalMeta} onCerrar={() => setModalMeta(false)} meta={resumen.meta} onGuardado={cargar} />
      <ModalPasos
        visible={modalPasos}
        onCerrar={() => setModalPasos(false)}
        pasosHoy={resumen.pasos}
        objetivo={resumen.meta.pasosObjetivo}
        semana={pasosSemana}
        onGuardado={cargar}
      />
      <ModalActividad visible={modalActividad} onCerrar={() => setModalActividad(false)} onGuardado={cargar} />
    </ScrollView>
  );
}

function LeyendaAnillo({ color, valor, etiqueta }: { color: string; valor: string; etiqueta: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontWeight: '800', fontSize: 13 }}>{valor}</Text>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>{etiqueta}</Text>
    </View>
  );
}

function ModalMetaDiaria({
  visible,
  onCerrar,
  meta,
  onGuardado,
}: {
  visible: boolean;
  onCerrar: () => void;
  meta: progresoApi.MetaSeguimiento;
  onGuardado: () => Promise<void>;
}) {
  const colors = useTheme();
  const [modo, setModo] = useState<'recomendar' | 'personalizado'>('recomendar');
  const [calorias, setCalorias] = useState(meta.caloriasQuemarObjetivo);
  const [minutos, setMinutos] = useState(meta.duracionObjetivoMin);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    try {
      await progresoApi.actualizarMetaSeguimiento({ caloriasQuemarObjetivo: calorias, duracionObjetivoMin: minutos });
      await onGuardado();
      onCerrar();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.modalFondo}>
        <View style={[styles.modalContenido, { backgroundColor: colors.background }]}>
          <View style={styles.filaEntreItems}>
            <Text style={[styles.seccionTitulo, { color: colors.text }]}>Objetivo diario</Text>
            <Pressable onPress={onCerrar}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.filaTipos}>
            <ChipModo etiqueta="Recomendar" activo={modo === 'recomendar'} onPress={() => setModo('recomendar')} />
            <ChipModo etiqueta="Personalizado" activo={modo === 'personalizado'} onPress={() => setModo('personalizado')} />
          </View>

          {modo === 'recomendar' ? (
            <View style={{ gap: Spacing.two }}>
              {PRESETS_META.map((p) => (
                <Pressable
                  key={p.nombre}
                  onPress={() => {
                    setCalorias(p.calorias);
                    setMinutos(p.minutos);
                  }}
                  style={[
                    styles.filaPreset,
                    {
                      borderColor: calorias === p.calorias && minutos === p.minutos ? colors.tint : colors.border,
                      backgroundColor: colors.backgroundElement,
                    },
                  ]}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{p.nombre}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {p.calorias} kcal · {p.minutos} min
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ gap: Spacing.three }}>
              <View>
                <Text style={{ color: colors.textSecondary, marginBottom: 4 }}>Calorías a quemar: {calorias}</Text>
                <ReglaHorizontal valor={calorias} minimo={100} maximo={1500} paso={10} pasoMayor={100} onCambiar={setCalorias} />
              </View>
              <View>
                <Text style={{ color: colors.textSecondary, marginBottom: 4 }}>Duración (min): {minutos}</Text>
                <ReglaHorizontal valor={minutos} minimo={5} maximo={180} paso={5} pasoMayor={30} onCambiar={setMinutos} />
              </View>
            </View>
          )}

          <Pressable onPress={guardar} disabled={guardando} style={[styles.botonGuardar, { backgroundColor: colors.tint }]}>
            {guardando ? (
              <ActivityIndicator color={colors.tintForeground} />
            ) : (
              <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Guardar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ChipModo({ etiqueta, activo, onPress }: { etiqueta: string; activo: boolean; onPress: () => void }) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chipTipo,
        { backgroundColor: activo ? colors.tint : colors.backgroundElement, borderColor: colors.tint },
      ]}>
      <Text style={{ color: activo ? colors.tintForeground : colors.text, fontSize: 13, fontWeight: '600' }}>{etiqueta}</Text>
    </Pressable>
  );
}

function ModalPasos({
  visible,
  onCerrar,
  pasosHoy,
  objetivo,
  semana,
  onGuardado,
}: {
  visible: boolean;
  onCerrar: () => void;
  pasosHoy: number;
  objetivo: number;
  semana: number[];
  onGuardado: () => Promise<void>;
}) {
  const colors = useTheme();
  const [nuevoObjetivo, setNuevoObjetivo] = useState(objetivo);
  const [agregando, setAgregando] = useState('');

  const podometro = usePodometro((cantidad) => {
    progresoApi.registrarPasos(cantidad).then(onGuardado);
  });

  async function guardarObjetivo() {
    await progresoApi.actualizarMetaSeguimiento({ pasosObjetivo: nuevoObjetivo });
    await onGuardado();
  }

  async function agregarPasos() {
    const cantidad = Number(agregando);
    if (!cantidad) return;
    await progresoApi.registrarPasos(cantidad);
    setAgregando('');
    await onGuardado();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.modalFondo}>
        <View style={[styles.modalContenido, { backgroundColor: colors.background }]}>
          <View style={styles.filaEntreItems}>
            <Text style={[styles.seccionTitulo, { color: colors.text }]}>Pasos</Text>
            <Pressable onPress={onCerrar}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>{pasosHoy}</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: Spacing.two }}>de {objetivo} pasos hoy</Text>

          <GraficaBarras
            valores={semana}
            diaActual={new Date().getDay()}
            color={colors.tint}
            colorFondo={colors.backgroundSelected}
            colorTexto={colors.textSecondary}
          />

          {podometro.disponible === false ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: Spacing.two }}>
              Tu dispositivo no tiene sensor de pasos disponible.
            </Text>
          ) : (
            <View style={[styles.tarjetaPodometro, { backgroundColor: colors.backgroundElement, marginTop: Spacing.two }]}>
              {podometro.activo ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.puntoActivo, { backgroundColor: colors.tint }]} />
                    <Text style={{ color: colors.text, fontWeight: '700' }}>
                      Contando en vivo: {podometro.pasosSesion} pasos
                    </Text>
                  </View>
                  <Pressable onPress={podometro.detener}>
                    <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 13 }}>Detener</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={{ color: colors.text, fontSize: 13, flex: 1 }}>
                    Cuenta tus pasos automáticamente con el sensor del teléfono mientras tengas la app abierta.
                  </Text>
                  <Pressable
                    onPress={podometro.iniciar}
                    style={[styles.pildoraDesbloqueo, { backgroundColor: colors.tint }]}>
                    <Ionicons name="walk" size={14} color={colors.tintForeground} />
                    <Text style={{ color: colors.tintForeground, fontWeight: '700', fontSize: 12 }}>Activar</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}

          <View style={styles.filaMacros}>
            <TextInput
              value={agregando}
              onChangeText={setAgregando}
              placeholder="Agregar pasos"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]}
            />
            <Pressable onPress={agregarPasos} style={[styles.botonAgregar, { backgroundColor: colors.tint }]}>
              <Ionicons name="add" size={18} color={colors.tintForeground} />
            </Pressable>
          </View>

          <Text style={{ color: colors.textSecondary, marginTop: Spacing.two }}>Meta diaria de pasos: {nuevoObjetivo}</Text>
          <ReglaHorizontal valor={nuevoObjetivo} minimo={1000} maximo={20000} paso={500} pasoMayor={5000} onCambiar={setNuevoObjetivo} />

          <Pressable onPress={guardarObjetivo} style={[styles.botonGuardar, { backgroundColor: colors.tint }]}>
            <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Guardar meta</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ModalActividad({
  visible,
  onCerrar,
  onGuardado,
}: {
  visible: boolean;
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
}) {
  const colors = useTheme();
  const [elegida, setElegida] = useState<(typeof CATALOGO_ACTIVIDADES)[number] | null>(null);
  const [duracion, setDuracion] = useState('30');
  const [distancia, setDistancia] = useState('');
  const [calorias, setCalorias] = useState('');
  const [guardando, setGuardando] = useState(false);

  function elegir(actividad: (typeof CATALOGO_ACTIVIDADES)[number]) {
    setElegida(actividad);
    setCalorias(String(Math.round(actividad.caloriasPorMinuto * Number(duracion || 30))));
  }

  function alCambiarDuracion(valor: string) {
    setDuracion(valor);
    if (elegida) setCalorias(String(Math.round(elegida.caloriasPorMinuto * (Number(valor) || 0))));
  }

  async function guardar() {
    if (!elegida || !duracion) return;
    setGuardando(true);
    try {
      await progresoApi.registrarActividad({
        nombre: elegida.nombre,
        duracionMin: Number(duracion),
        distanciaM: distancia ? Number(distancia) * 1000 : undefined,
        caloriasEstimadas: Number(calorias) || 1,
      });
      setElegida(null);
      setDuracion('30');
      setDistancia('');
      setCalorias('');
      await onGuardado();
      onCerrar();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.modalFondo}>
        <View style={[styles.modalContenido, { backgroundColor: colors.background, maxHeight: '85%' }]}>
          <View style={styles.filaEntreItems}>
            <Text style={[styles.seccionTitulo, { color: colors.text }]}>
              {elegida ? elegida.nombre : 'Añadir actividad'}
            </Text>
            <Pressable onPress={elegida ? () => setElegida(null) : onCerrar}>
              <Ionicons name={elegida ? 'arrow-back' : 'close'} size={24} color={colors.text} />
            </Pressable>
          </View>

          {!elegida ? (
            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.gridActividades}>
                {CATALOGO_ACTIVIDADES.map((a) => (
                  <Pressable
                    key={a.nombre}
                    onPress={() => elegir(a)}
                    style={[styles.itemActividad, { backgroundColor: colors.backgroundElement }]}>
                    <Ionicons name={a.icono as any} size={24} color={colors.tint} />
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                      {a.nombre}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={{ gap: Spacing.two }}>
              <TextInput
                value={duracion}
                onChangeText={alCambiarDuracion}
                placeholder="Duración (min)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
              {elegida.tieneDistancia && (
                <TextInput
                  value={distancia}
                  onChangeText={setDistancia}
                  placeholder="Distancia (km, opcional)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                />
              )}
              <TextInput
                value={calorias}
                onChangeText={setCalorias}
                placeholder="Calorías estimadas"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
              <Pressable
                onPress={guardar}
                disabled={guardando || !duracion}
                style={[styles.botonGuardar, { backgroundColor: colors.tint }]}>
                {guardando ? (
                  <ActivityIndicator color={colors.tintForeground} />
                ) : (
                  <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Añadir</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ---------- PESO ----------

function TabPeso() {
  const colors = useTheme();
  const { cliente, actualizarCliente } = useSesion();
  const [ahora] = useState(() => Date.now());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroProgreso[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [alturaCm, setAlturaCm] = useState('');
  const [pesoKg, setPesoKg] = useState(70);
  const [grasaCorporalPct, setGrasaCorporalPct] = useState('');
  const [pesoObjetivo, setPesoObjetivo] = useState(cliente?.pesoObjetivoKg ?? 70);

  const [recalculando, setRecalculando] = useState(false);
  const [mensajeRecalculo, setMensajeRecalculo] = useState<{ texto: string; esError: boolean } | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const datos = await progresoApi.listarProgreso();
      setRegistros(datos);
      if (datos[0]?.pesoKg) setPesoKg(datos[0].pesoKg);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos cargar tu progreso');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function guardar() {
    setGuardando(true);
    try {
      if (!cliente?.alturaCm && alturaCm) {
        await progresoApi.actualizarAltura(Number(alturaCm));
        actualizarCliente?.({ alturaCm: Number(alturaCm) });
      }
      await progresoApi.registrarProgreso({
        pesoKg,
        grasaCorporalPct: grasaCorporalPct ? Number(grasaCorporalPct) : undefined,
      });
      setGrasaCorporalPct('');
      setModalVisible(false);
      await cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function guardarObjetivo() {
    await progresoApi.actualizarPesoObjetivo(pesoObjetivo);
    actualizarCliente?.({ pesoObjetivoKg: pesoObjetivo });
  }

  async function recalcular() {
    setRecalculando(true);
    setMensajeRecalculo(null);
    try {
      const resultado = await clientesApi.recalcularRutina();
      const objetivo = OBJETIVO_LABEL[resultado.objetivoCalculado] ?? resultado.objetivoCalculado;
      setMensajeRecalculo({
        texto: resultado.rutinaAsignada
          ? `Nuevo objetivo: ${objetivo}. Te asignamos "${resultado.rutinaAsignada.nombre}".`
          : `Nuevo objetivo: ${objetivo}. Tu gimnasio aún no tiene una rutina que combine bien, avísale a tu entrenador.`,
        esError: false,
      });
    } catch (e) {
      setMensajeRecalculo({
        texto: e instanceof ErrorApi ? e.message : 'No pudimos recalcular tu rutina',
        esError: true,
      });
    } finally {
      setRecalculando(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centro, { gap: Spacing.two }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.four }}>
          {error}
        </Text>
        <Pressable onPress={cargar} style={{ borderWidth: 1.5, borderColor: colors.tint, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 }}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const ultimo = registros[0];
  const anterior = registros[1];
  const cambioPeso = ultimo?.pesoKg && anterior?.pesoKg ? ultimo.pesoKg - anterior.pesoKg : null;
  const imc = ultimo?.pesoKg && cliente?.alturaCm ? calcularImc(ultimo.pesoKg, cliente.alturaCm) : null;
  const promedio30 = (() => {
    const haceUnMes = ahora - 30 * 24 * 60 * 60 * 1000;
    const enRango = registros.filter((r) => r.pesoKg && new Date(r.fecha).getTime() >= haceUnMes);
    if (enRango.length === 0) return null;
    return enRango.reduce((s, r) => s + (r.pesoKg ?? 0), 0) / enRango.length;
  })();

  const puntosGrafica = [...registros]
    .filter((r) => r.pesoKg)
    .reverse()
    .map((r) => ({ fecha: r.fecha, valor: r.pesoKg as number }));

  return (
    <ScrollView contentContainerStyle={styles.contenidoTab}>
      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.filaEntreItems}>
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Peso actual</Text>
            <Text style={[styles.valorGrande, { color: colors.text }]}>
              {ultimo?.pesoKg ? `${ultimo.pesoKg} kg` : '—'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Objetivo</Text>
            <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 18 }}>{pesoObjetivo} kg</Text>
          </View>
        </View>
        {(cambioPeso !== null || promedio30 !== null) && (
          <View style={[styles.filaEntreItems, { marginTop: Spacing.two }]}>
            {cambioPeso !== null && (
              <Text style={{ color: cambioPeso <= 0 ? colors.tint : colors.danger, fontSize: 12, fontWeight: '700' }}>
                {cambioPeso > 0 ? '+' : ''}
                {cambioPeso.toFixed(1)} kg desde el último registro
              </Text>
            )}
            {promedio30 !== null && (
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Prom. 30d: {promedio30.toFixed(1)} kg</Text>
            )}
          </View>
        )}

        <View style={{ marginTop: Spacing.three }}>
          <GraficaLinea
            puntos={puntosGrafica}
            metaValor={pesoObjetivo}
            color={colors.tint}
            colorMeta={colors.info}
            colorTexto={colors.textSecondary}
            colorFondoTooltip={colors.text === '#ffffff' ? '#2A2A2E' : '#1C1C1E'}
            unidad="kg"
          />
        </View>

        <Pressable onPress={() => setModalVisible(true)} style={[styles.botonGuardar, { backgroundColor: colors.tint, marginTop: Spacing.three }]}>
          <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Registrar peso</Text>
        </Pressable>
      </View>

      <View style={[styles.tarjeta, { backgroundColor: colors.backgroundElement }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>IMC</Text>
        {imc ? (
          <>
            <Text style={[styles.valorGrande, { color: colors.text }]}>{imc.toFixed(1)}</Text>
            <BarraImc imc={imc} colorIndicador={colors.text} />
            <Text style={{ color: colors.tint, fontSize: 13, fontWeight: '600', marginTop: Spacing.two }}>
              {categoriaImc(imc)}
            </Text>
          </>
        ) : (
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Agrega tu altura y peso para calcular tu IMC
          </Text>
        )}
      </View>

      {ultimo?.pesoKg && (
        <View style={styles.recalculoZona}>
          <Pressable
            onPress={recalcular}
            disabled={recalculando}
            style={[styles.botonRecalcular, { borderColor: colors.tint, opacity: recalculando ? 0.6 : 1 }]}>
            {recalculando ? (
              <ActivityIndicator color={colors.tint} size="small" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color={colors.tint} />
                <Text style={{ color: colors.tint, fontWeight: '700' }}>Recalcular mi rutina</Text>
              </>
            )}
          </Pressable>
          {mensajeRecalculo && (
            <Text
              style={{
                color: mensajeRecalculo.esError ? colors.danger : colors.textSecondary,
                fontSize: 13,
                marginTop: Spacing.one,
                textAlign: 'center',
              }}>
              {mensajeRecalculo.texto}
            </Text>
          )}
        </View>
      )}

      <Text style={[styles.seccionTitulo, { color: colors.text }]}>Historial</Text>
      <View style={{ gap: Spacing.two }}>
        {registros.map((registro) => (
          <View key={registro.id} style={[styles.filaHistorial, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, width: 70 }}>
              {new Date(registro.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            </Text>
            <Text style={{ color: colors.text, flex: 1 }}>{registro.pesoKg ? `${registro.pesoKg} kg` : '—'}</Text>
            <Text style={{ color: colors.textSecondary }}>
              {registro.grasaCorporalPct ? `${registro.grasaCorporalPct}% grasa` : ''}
            </Text>
          </View>
        ))}
        {registros.length === 0 && (
          <Text style={{ color: colors.textSecondary }}>Aún no tienes registros de peso.</Text>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: colors.background }]}>
            <View style={styles.filaEntreItems}>
              <Text style={[styles.seccionTitulo, { color: colors.text }]}>Nuevo registro</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {!cliente?.alturaCm && (
              <TextInput
                value={alturaCm}
                onChangeText={setAlturaCm}
                placeholder="Tu altura (cm)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
            )}

            <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', textAlign: 'center' }}>
              {pesoKg.toFixed(1)} <Text style={{ fontSize: 15, fontWeight: '600' }}>kg</Text>
            </Text>
            <ReglaHorizontal valor={pesoKg} minimo={35} maximo={180} paso={0.5} pasoMayor={10} onCambiar={setPesoKg} />

            <TextInput
              value={grasaCorporalPct}
              onChangeText={setGrasaCorporalPct}
              placeholder="% Grasa corporal (opcional)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={[styles.input, { borderColor: colors.border, color: colors.text, marginTop: Spacing.two }]}
            />

            <Text style={{ color: colors.textSecondary, marginTop: Spacing.three }}>Peso objetivo: {pesoObjetivo} kg</Text>
            <ReglaHorizontal valor={pesoObjetivo} minimo={35} maximo={180} paso={0.5} pasoMayor={10} onCambiar={setPesoObjetivo} />

            <Pressable
              onPress={async () => {
                await guardarObjetivo();
                await guardar();
              }}
              disabled={guardando}
              style={[styles.botonGuardar, { backgroundColor: colors.tint, opacity: guardando ? 0.7 : 1 }]}>
              {guardando ? (
                <ActivityIndicator color={colors.tintForeground} />
              ) : (
                <Text style={{ color: colors.tintForeground, fontWeight: '700' }}>Guardar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contenidoTab: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  titulo: { fontSize: 26, fontWeight: '800', marginTop: Spacing.six, paddingHorizontal: Spacing.four },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.four, borderBottomWidth: 1, marginTop: Spacing.two },
  tabBoton: { paddingVertical: Spacing.two, marginRight: Spacing.four },
  tabSubrayado: { height: 3, borderRadius: 2, marginTop: 6 },
  filaEntreItems: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filaTarjetas: { flexDirection: 'row', gap: Spacing.two },
  tarjeta: { borderRadius: 18, padding: Spacing.three, gap: 2 },
  valorGrande: { fontSize: 24, fontWeight: '800' },
  seccionTitulo: { fontSize: 18, fontWeight: '800' },
  botonAgregar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  filaCalendario: { flexDirection: 'row', justifyContent: 'space-between' },
  diaCalendario: { alignItems: 'center' },
  circuloDia: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  filaAnillo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four, marginTop: Spacing.two },
  pildoraDesbloqueo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tarjetaPodometro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 14,
    padding: Spacing.three,
  },
  puntoActivo: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filaActividad: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: Spacing.two },
  recalculoZona: { alignItems: 'center' },
  botonRecalcular: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
  },
  filaHistorial: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: Spacing.two },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContenido: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.four, gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 12, fontSize: 15 },
  botonGuardar: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.two },
  filaTipos: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  chipTipo: { borderWidth: 1.5, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  filaPreset: { borderWidth: 1.5, borderRadius: 14, padding: Spacing.three },
  filaMacros: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', marginTop: Spacing.two },
  gridActividades: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, paddingBottom: Spacing.two },
  itemActividad: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 6,
  },
});
