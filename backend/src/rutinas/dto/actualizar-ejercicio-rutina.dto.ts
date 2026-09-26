import { IsInt, IsOptional, IsPositive } from 'class-validator'

export class ActualizarEjercicioRutinaDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  series?: number

  @IsOptional()
  @IsInt()
  @IsPositive()
  repeticiones?: number

  @IsOptional()
  @IsInt()
  @IsPositive()
  duracionSeg?: number

  @IsOptional()
  @IsInt()
  @IsPositive()
  descansoSeg?: number
}
