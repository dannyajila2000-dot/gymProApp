import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, Matches, Max, Min } from 'class-validator'

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
}
