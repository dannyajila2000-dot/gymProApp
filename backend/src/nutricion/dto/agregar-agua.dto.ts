import { IsInt, IsPositive } from 'class-validator'

export class AgregarAguaDto {
  @IsInt()
  @IsPositive()
  cantidadMl!: number
}
