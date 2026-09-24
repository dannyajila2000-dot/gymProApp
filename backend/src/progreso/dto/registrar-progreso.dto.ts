import { IsNumber, IsObject, IsOptional, IsPositive, IsString } from 'class-validator'

export class RegistrarProgresoDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  pesoKg?: number

  @IsOptional()
  @IsNumber()
  @IsPositive()
  grasaCorporalPct?: number

  @IsOptional()
  @IsObject()
  medidas?: Record<string, number>

  @IsOptional()
  @IsString()
  fotoUrl?: string
}
