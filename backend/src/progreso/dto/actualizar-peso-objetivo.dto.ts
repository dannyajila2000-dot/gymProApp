import { IsNumber, IsPositive } from 'class-validator'

export class ActualizarPesoObjetivoDto {
  @IsNumber()
  @IsPositive()
  pesoObjetivoKg!: number
}
