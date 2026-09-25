import { createContext, useContext, useState, type PropsWithChildren } from 'react';

export interface RespuestasOnboarding {
  nivelFitness: 'principiante' | 'intermedio' | 'avanzado' | null;
  nivelActividad: number;
  alturaCm: number;
  pesoActualKg: number;
  pesoObjetivoKg: number;
  restriccionFisica: 'ninguna' | 'impacto_bajo' | 'sin_saltos' | null;
  horaRecordatorio: string | null;
}

const VALORES_INICIALES: RespuestasOnboarding = {
  nivelFitness: null,
  nivelActividad: 1,
  alturaCm: 170,
  pesoActualKg: 70,
  pesoObjetivoKg: 65,
  restriccionFisica: null,
  horaRecordatorio: '20:00',
};

interface OnboardingContextValor {
  respuestas: RespuestasOnboarding;
  actualizar: (parcial: Partial<RespuestasOnboarding>) => void;
}

const OnboardingContext = createContext<OnboardingContextValor | null>(null);

export function useOnboarding() {
  const valor = useContext(OnboardingContext);
  if (!valor) throw new Error('useOnboarding debe usarse dentro de <OnboardingProvider />');
  return valor;
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [respuestas, setRespuestas] = useState<RespuestasOnboarding>(VALORES_INICIALES);

  function actualizar(parcial: Partial<RespuestasOnboarding>) {
    setRespuestas((actual) => ({ ...actual, ...parcial }));
  }

  return (
    <OnboardingContext.Provider value={{ respuestas, actualizar }}>
      {children}
    </OnboardingContext.Provider>
  );
}
