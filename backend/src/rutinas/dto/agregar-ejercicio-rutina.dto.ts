import { IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator'

export class AgregarEjercicioRutinaDto {
  @IsUUID()
  ejercicioId!: string

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
