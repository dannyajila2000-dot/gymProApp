import { IsInt, IsPositive } from 'class-validator'

export class RegistrarPasosDto {
  @IsInt()
  @IsPositive()
  cantidad!: number
}
