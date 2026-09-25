import { IsBoolean, IsInt, IsOptional, IsPositive } from 'class-validator'

export class ActualizarMetaSeguimientoDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  caloriasQuemarObjetivo?: number

  @IsOptional()
  @IsInt()
  @IsPositive()
  duracionObjetivoMin?: number

  @IsOptional()
  @IsInt()
  @IsPositive()
  pasosObjetivo?: number

  @IsOptional()
  @IsBoolean()
  pasosActivo?: boolean
}
