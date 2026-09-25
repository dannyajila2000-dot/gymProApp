import { IsNumber, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator'

export class RegistrarActividadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nombre!: string

  @IsNumber()
  @IsPositive()
  duracionMin!: number

  @IsOptional()
  @IsNumber()
  @IsPositive()
  distanciaM?: number

  @IsNumber()
  @IsPositive()
  caloriasEstimadas!: number
}
