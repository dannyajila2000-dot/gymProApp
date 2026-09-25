import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

export class CrearFeedbackDto {
  @IsIn(['muy_dificil', 'demasiado_facil', 'errores', 'sugerencia', 'otro'])
  categoria!: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  mensaje?: string
}
