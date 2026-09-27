import { IsInt, IsOptional, IsPositive } from 'class-validator'

export class ActualizarEjercicioRutinaDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  series?: number

  @IsOptional()
  @IsInt()
  @IsPositive()
  repeticiones?: number | null

  @IsOptional()
  @IsInt()
  @IsPositive()
  duracionSeg?: number | null

  @IsOptional()
  @IsInt()
  @IsPositive()
  descansoSeg?: number
}
