import { IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator'

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
}
