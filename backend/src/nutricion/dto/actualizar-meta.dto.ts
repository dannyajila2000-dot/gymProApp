import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsPositive, Matches } from 'class-validator'

export class ActualizarMetaDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  caloriasObjetivo?: number

  @IsOptional()
  @IsNumber()
  @IsPositive()
  proteinaObjetivoG?: number

  @IsOptional()
  @IsNumber()
  @IsPositive()
  carbosObjetivoG?: number

  @IsOptional()
  @IsNumber()
  @IsPositive()
  grasaObjetivoG?: number

  @IsOptional()
  @IsInt()
  @IsPositive()
  aguaObjetivoMl?: number

  @IsOptional()
  @IsBoolean()
  aguaAlarmaActiva?: boolean

  @IsOptional()
  @IsIn([1, 2, 3, 4, 6, 8])
  aguaAlarmaCadaHoras?: number

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato de hora inválido (HH:mm)' })
  aguaVentanaInicio?: string

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato de hora inválido (HH:mm)' })
  aguaVentanaFin?: string
}
