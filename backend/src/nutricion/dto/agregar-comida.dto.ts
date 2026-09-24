import { IsIn, IsNumber, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator'

export class AgregarComidaDto {
  @IsIn(['desayuno', 'almuerzo', 'cena', 'snack'])
  tipo!: string

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre!: string

  @IsNumber()
  @IsPositive()
  calorias!: number

  @IsOptional()
  @IsNumber()
  @IsPositive()
  proteinaG?: number

  @IsOptional()
  @IsNumber()
  @IsPositive()
  carbosG?: number

  @IsOptional()
  @IsNumber()
  @IsPositive()
  grasaG?: number
}
