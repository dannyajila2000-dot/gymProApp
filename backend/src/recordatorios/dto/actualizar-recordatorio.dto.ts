import { ArrayMinSize, ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsOptional, Matches, Max, Min } from 'class-validator'

export class ActualizarRecordatorioDto {
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'hora debe tener el formato HH:mm' })
  hora?: string

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  diasSemana?: number[]

  @IsOptional()
  @IsBoolean()
  activo?: boolean
}
