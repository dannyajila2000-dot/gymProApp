import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import type { RecomendacionRutina } from '@/api/clientes';

export type ObjetivoPrincipal = 'perdida_grasa' | 'ganar_musculo' | 'tonificar' | 'resistencia' | 'salud';

export type ZonaLesion =
  | 'cuello'
  | 'hombro'
  | 'codo'
  | 'muneca'
  | 'espalda_baja'
  | 'cadera'
  | 'rodilla'
  | 'tobillo';

export interface RespuestasOnboarding {
  objetivoPrincipal: ObjetivoPrincipal | null;
  nivelFitness: 'principiante' | 'intermedio' | 'avanzado' | null;
  /** Veces por semana que entrenó en los últimos 3 meses: 0 a 4 (4 = 4 o más). */
  historialEntrenamiento: number | null;
  nivelActividad: number;
  /** Días por semana que quiere entrenar. */
  frecuenciaSemanal: number | null;
  /** 0 = domingo ... 6 = sábado. */
  diasEntrenamiento: number[];
  horaEntrenamiento: string;
  recordarme: boolean;
  alturaCm: number;
  pesoActualKg: number;
  pesoObjetivoKg: number;
  zonasLesion: ZonaLesion[];
  restriccionFisica: 'ninguna' | 'impacto_bajo' | 'sin_saltos' | null;
  sucursalId: string | null;
  /** Nombre de la sucursal elegida, solo para mostrarlo en el resumen. */
  sucursalNombre: string | null;
}

const VALORES_INICIALES: RespuestasOnboarding = {
  objetivoPrincipal: null,
  nivelFitness: null,
  historialEntrenamiento: null,
  nivelActividad: 1,
  frecuenciaSemanal: null,
  diasEntrenamiento: [],
  horaEntrenamiento: '18:00',
  recordarme: true,
  alturaCm: 170,
  pesoActualKg: 70,
  pesoObjetivoKg: 65,
  zonasLesion: [],
  restriccionFisica: null,
  sucursalId: null,
  sucursalNombre: null,
};

/** Lo que devuelve el servidor al terminar la encuesta: las rutinas recomendadas y la que quedó asignada. */
export interface ResultadoRecomendacion {
  recomendaciones: RecomendacionRutina[];
  rutinaAsignadaId: string | null;
}

interface OnboardingContextValor {
  respuestas: RespuestasOnboarding;
  actualizar: (parcial: Partial<RespuestasOnboarding>) => void;
  resultado: ResultadoRecomendacion | null;
  guardarResultado: (resultado: ResultadoRecomendacion) => void;
}

const OnboardingContext = createContext<OnboardingContextValor | null>(null);

export function useOnboarding() {
  const valor = useContext(OnboardingContext);
  if (!valor) throw new Error('useOnboarding debe usarse dentro de <OnboardingProvider />');
  return valor;
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [respuestas, setRespuestas] = useState<RespuestasOnboarding>(VALORES_INICIALES);
  const [resultado, setResultado] = useState<ResultadoRecomendacion | null>(null);

  function actualizar(parcial: Partial<RespuestasOnboarding>) {
    setRespuestas((actual) => ({ ...actual, ...parcial }));
  }

  return (
    <OnboardingContext.Provider value={{ respuestas, actualizar, resultado, guardarResultado: setResultado }}>
      {children}
    </OnboardingContext.Provider>
  );
}
