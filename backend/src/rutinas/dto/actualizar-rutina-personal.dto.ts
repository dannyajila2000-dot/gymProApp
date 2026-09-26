import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class ActualizarRutinaPersonalDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nombre?: string

  @IsOptional()
  @IsIn(['principiante', 'intermedio', 'avanzado'])
  nivel?: string

  @IsOptional()
  @IsIn(['fuerza', 'cardio', 'perdida_grasa', 'tren_superior', 'tren_inferior', 'cuerpo_completo', 'core'])
  objetivo?: string
}
