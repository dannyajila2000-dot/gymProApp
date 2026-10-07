import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator'
import { ZONAS_LESION } from '../../rutinas/lesiones.util.js'

export class OnboardingDto {
  @IsIn(['principiante', 'intermedio', 'avanzado'])
  nivelFitness!: string

  @IsInt()
  @Min(0)
  @Max(3)
  nivelActividad!: number

  @IsNumber()
  @Min(50)
  @Max(272)
  alturaCm!: number

  @IsNumber()
  @IsPositive()
  pesoActualKg!: number

  @IsNumber()
  @IsPositive()
  pesoObjetivoKg!: number

  @IsIn(['ninguna', 'impacto_bajo', 'sin_saltos'])
  restriccionFisica!: string

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'horaRecordatorio debe tener el formato HH:mm' })
  horaRecordatorio?: string

  // ---- Respuestas ampliadas del onboarding (opcionales: el APK anterior no las envía) ----

  @IsOptional()
  @IsIn(['perdida_grasa', 'ganar_musculo', 'tonificar', 'resistencia', 'salud'])
  objetivoPrincipal?: string

  /** Veces por semana que entrenó en los últimos 3 meses: 0 a 4 (4 = 4 o más). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  historialEntrenamiento?: number

  /** Días por semana que quiere entrenar. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  frecuenciaSemanal?: number

  /** Días elegidos para entrenar: 0 = domingo ... 6 = sábado. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  diasEntrenamiento?: number[]

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'horaEntrenamiento debe tener el formato HH:mm' })
  horaEntrenamiento?: string

  /** ¿Quiere un recordatorio a esa hora los días elegidos? */
  @IsOptional()
  @IsBoolean()
  recordarme?: boolean

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(ZONAS_LESION.length)
  @ArrayUnique()
  @IsIn(ZONAS_LESION, { each: true })
  zonasLesion?: string[]

  @IsOptional()
  @IsUUID()
  sucursalId?: string
}
