import { IsInt, IsNumber, IsPositive, IsUUID } from 'class-validator'

export class RegistrarSesionDto {
  @IsUUID()
  rutinaId!: string

  @IsInt()
  @IsPositive()
  duracionMin!: number

  @IsNumber()
  @IsPositive()
  caloriasEstimadas!: number
}
